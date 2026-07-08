# -*- coding: utf-8 -*-
"""
Reproducción automática de música en Spotify (requiere cuenta Premium).

Usa el flujo de autorización de Spotify (Authorization Code): el rector o
docente conecta la cuenta UNA sola vez desde el panel web, y desde entonces
el agente puede iniciar y pausar la música sin intervención humana.

El permiso queda guardado en `token_spotify.json` (excluido de git).
"""

import base64
import json
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from .configuracion import cargar_credenciales

URL_TOKEN = "https://accounts.spotify.com/api/token"
URL_AUTORIZAR = "https://accounts.spotify.com/authorize"
URL_API = "https://api.spotify.com/v1"

PERMISOS = "user-modify-playback-state user-read-playback-state"
RUTA_TOKEN = Path(__file__).resolve().parent / "token_spotify.json"

_estado_oauth = None  # protección anti-falsificación del flujo de autorización


# ---------------------------------------------------------------------- #
# Flujo de autorización (una sola vez)
# ---------------------------------------------------------------------- #
def url_autorizacion(redirect_uri):
    """URL de Spotify a la que se envía al usuario para conectar su cuenta."""
    global _estado_oauth
    client_id, _ = cargar_credenciales()
    if not client_id:
        raise RuntimeError("Primero guarde las credenciales de Spotify.")
    _estado_oauth = secrets.token_urlsafe(16)
    parametros = urllib.parse.urlencode({
        "client_id": client_id,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "scope": PERMISOS,
        "state": _estado_oauth,
    })
    return f"{URL_AUTORIZAR}?{parametros}"


def intercambiar_codigo(codigo, estado, redirect_uri):
    """Cambia el código de autorización por tokens y los guarda."""
    if not _estado_oauth or estado != _estado_oauth:
        raise RuntimeError("La autorización no coincide; intente de nuevo.")
    datos = _peticion_token({
        "grant_type": "authorization_code",
        "code": codigo,
        "redirect_uri": redirect_uri,
    })
    _guardar_tokens(datos)


def _peticion_token(cuerpo):
    client_id, client_secret = cargar_credenciales()
    credenciales = base64.b64encode(
        f"{client_id}:{client_secret}".encode()
    ).decode("ascii")
    peticion = urllib.request.Request(
        URL_TOKEN,
        data=urllib.parse.urlencode(cuerpo).encode(),
        headers={
            "Authorization": f"Basic {credenciales}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    with urllib.request.urlopen(peticion, timeout=30) as respuesta:
        return json.loads(respuesta.read().decode("utf-8"))


def _guardar_tokens(datos, refresh_anterior=None):
    guardado = {
        "access_token": datos["access_token"],
        "refresh_token": datos.get("refresh_token") or refresh_anterior,
        "expira_en": time.time() + int(datos.get("expires_in", 3600)),
    }
    RUTA_TOKEN.write_text(json.dumps(guardado, indent=2), encoding="utf-8")


def hay_cuenta_conectada():
    return RUTA_TOKEN.exists()


def desconectar():
    RUTA_TOKEN.unlink(missing_ok=True)


def _token_acceso():
    if not RUTA_TOKEN.exists():
        raise RuntimeError(
            "No hay una cuenta de Spotify conectada. Conéctela desde el panel."
        )
    tokens = json.loads(RUTA_TOKEN.read_text(encoding="utf-8"))
    if time.time() > tokens["expira_en"] - 60:
        datos = _peticion_token({
            "grant_type": "refresh_token",
            "refresh_token": tokens["refresh_token"],
        })
        _guardar_tokens(datos, refresh_anterior=tokens["refresh_token"])
        tokens = json.loads(RUTA_TOKEN.read_text(encoding="utf-8"))
    return tokens["access_token"]


# ---------------------------------------------------------------------- #
# Control de reproducción
# ---------------------------------------------------------------------- #
def _api(metodo, ruta, cuerpo=None):
    peticion = urllib.request.Request(
        f"{URL_API}{ruta}",
        method=metodo,
        data=json.dumps(cuerpo).encode() if cuerpo is not None else None,
        headers={
            "Authorization": f"Bearer {_token_acceso()}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(peticion, timeout=30) as respuesta:
            texto = respuesta.read().decode("utf-8").strip()
            if not texto:
                return {}
            try:
                return json.loads(texto)
            except json.JSONDecodeError:
                # Los comandos de reproducción (play/pause) a veces responden
                # con un cuerpo que no es JSON; como no lo necesitamos, se ignora.
                return {}
    except urllib.error.HTTPError as error:
        detalle = ""
        try:
            detalle = json.loads(error.read().decode())["error"]["message"]
        except Exception:  # noqa: BLE001
            pass
        if error.code == 403 and "PREMIUM" in detalle.upper():
            raise RuntimeError(
                "La cuenta conectada no es Spotify Premium. Spotify solo "
                "permite reproducción automática con cuentas Premium."
            ) from error
        raise RuntimeError(detalle or f"Spotify respondió error {error.code}.") from error


def dispositivos():
    return _api("GET", "/me/player/devices").get("devices", [])


def iniciar_reproduccion(uris):
    """Empieza a sonar la música en el dispositivo disponible. Sin clics."""
    if not uris:
        raise RuntimeError("No hay canciones para reproducir todavía.")
    aparatos = dispositivos()
    if not aparatos:
        raise RuntimeError(
            "Spotify no está abierto en ningún dispositivo. Abra la aplicación "
            "de Spotify en este computador (con sesión iniciada) y déjela abierta."
        )
    elegido = next((d for d in aparatos if d.get("is_active")), aparatos[0])
    _api(
        "PUT",
        f"/me/player/play?device_id={elegido['id']}",
        {"uris": uris[:50]},
    )
    return elegido.get("name", "dispositivo")


def pausar():
    """Detiene la música (fin de la franja)."""
    try:
        _api("PUT", "/me/player/pause")
    except RuntimeError as error:
        # Si ya no hay nada sonando, Spotify devuelve error: no es grave.
        if "NO_ACTIVE_DEVICE" not in str(error).upper() and "not found" not in str(error).lower():
            raise
