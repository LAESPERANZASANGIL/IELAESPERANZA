# -*- coding: utf-8 -*-
"""
Cliente mínimo de la API Web de Spotify (flujo Client Credentials).

Las credenciales se obtienen gratis en https://developer.spotify.com/dashboard
creando una aplicación, y se guardan desde la aplicación web (webapp.py) en
`credenciales.json`, o bien en las variables de entorno SPOTIFY_CLIENT_ID y
SPOTIFY_CLIENT_SECRET.
"""

import base64
import time
import urllib.error
import urllib.parse
import urllib.request
import json

from .configuracion import cargar_credenciales

URL_TOKEN = "https://accounts.spotify.com/api/token"
URL_BUSQUEDA = "https://api.spotify.com/v1/search"

# Identificarse como navegador evita que la protección anti-robots de Spotify
# rechace las peticiones de Python con un error 403 en algunas redes.
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 AgenteMusicaLaEsperanza/1.0"
)


class ClienteSpotify:
    def __init__(self, client_id=None, client_secret=None):
        if not client_id or not client_secret:
            client_id, client_secret = cargar_credenciales()
        self.client_id = client_id
        self.client_secret = client_secret
        if not self.client_id or not self.client_secret:
            raise RuntimeError(
                "Faltan las credenciales de Spotify. Guárdelas desde la aplicación "
                "web (sección Credenciales) o defina las variables de entorno "
                "SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET."
            )
        self._token = None
        self._token_expira = 0.0

    # ------------------------------------------------------------------ #
    def _obtener_token(self):
        """Pide (o reutiliza) un token de acceso de la API de Spotify."""
        if self._token and time.time() < self._token_expira - 60:
            return self._token

        credenciales = f"{self.client_id}:{self.client_secret}".encode("utf-8")
        cabecera = base64.b64encode(credenciales).decode("ascii")
        datos = urllib.parse.urlencode({"grant_type": "client_credentials"}).encode()
        peticion = urllib.request.Request(
            URL_TOKEN,
            data=datos,
            headers={
                "Authorization": f"Basic {cabecera}",
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": USER_AGENT,
            },
        )
        with urllib.request.urlopen(peticion, timeout=30) as respuesta:
            cuerpo = json.loads(respuesta.read().decode("utf-8"))

        self._token = cuerpo["access_token"]
        self._token_expira = time.time() + int(cuerpo.get("expires_in", 3600))
        return self._token

    # ------------------------------------------------------------------ #
    def _get(self, url, parametros):
        token = self._obtener_token()
        url_completa = f"{url}?{urllib.parse.urlencode(parametros)}"
        peticion = urllib.request.Request(
            url_completa,
            headers={
                "Authorization": f"Bearer {token}",
                "User-Agent": USER_AGENT,
            },
        )
        try:
            with urllib.request.urlopen(peticion, timeout=30) as respuesta:
                return json.loads(respuesta.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            # Muestra el motivo REAL que envía Spotify (no solo "Forbidden").
            cuerpo_bruto = ""
            detalle = ""
            try:
                cuerpo_bruto = error.read().decode("utf-8", errors="replace").strip()
                info_error = json.loads(cuerpo_bruto).get("error", {})
                detalle = " ".join(
                    filter(None, [info_error.get("message"), info_error.get("reason")])
                )
            except Exception:  # noqa: BLE001
                pass

            if error.code == 403 and not detalle:
                # Spotify/Cloudflare a veces bloquea temporalmente sin dar
                # motivo cuando detecta muchas peticiones seguidas desde la
                # misma red (lo confunde con actividad de robot).
                raise RuntimeError(
                    "HTTP 403: Forbidden (sin motivo detallado). Si esto pasa "
                    "después de varias búsquedas seguidas, es probable que "
                    "Spotify haya bloqueado temporalmente esta conexión por "
                    "exceso de peticiones; espere 10-15 minutos sin buscar y "
                    "vuelva a intentar."
                ) from error
            raise RuntimeError(
                f"HTTP {error.code}: {detalle or cuerpo_bruto or error.reason}"
            ) from error

    # ------------------------------------------------------------------ #
    def buscar_canciones(self, consulta, limite=10, mercado="CO"):
        """Busca canciones y descarta las que tienen contenido explícito."""
        datos = self._get(
            URL_BUSQUEDA,
            {"q": consulta, "type": "track", "limit": limite, "market": mercado},
        )
        canciones = []
        for pista in datos.get("tracks", {}).get("items", []):
            if pista is None or pista.get("explicit"):
                continue  # se excluye todo contenido explícito: uso escolar
            canciones.append(
                {
                    "uri": pista.get("uri"),
                    "nombre": pista.get("name"),
                    "artistas": [a.get("name") for a in pista.get("artists", [])],
                    "album": (pista.get("album") or {}).get("name"),
                    "duracion_min": round((pista.get("duration_ms") or 0) / 60000, 2),
                    "enlace": (pista.get("external_urls") or {}).get("spotify"),
                }
            )
        return canciones

    # ------------------------------------------------------------------ #
    def buscar_playlists(self, consulta, limite=5, mercado="CO"):
        """Busca listas de reproducción relacionadas con la consulta."""
        datos = self._get(
            URL_BUSQUEDA,
            {"q": consulta, "type": "playlist", "limit": limite, "market": mercado},
        )
        listas = []
        for lista in datos.get("playlists", {}).get("items", []):
            if lista is None:
                continue
            listas.append(
                {
                    "nombre": lista.get("name"),
                    "autor": (lista.get("owner") or {}).get("display_name"),
                    "total_canciones": (lista.get("tracks") or {}).get("total"),
                    "enlace": (lista.get("external_urls") or {}).get("spotify"),
                }
            )
        return listas
