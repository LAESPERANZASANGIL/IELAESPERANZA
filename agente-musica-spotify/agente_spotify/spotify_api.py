# -*- coding: utf-8 -*-
"""
Cliente mínimo de la API Web de Spotify (flujo Client Credentials).

Las credenciales se obtienen gratis en https://developer.spotify.com/dashboard
creando una aplicación, y se guardan desde la aplicación web (webapp.py) en
`credenciales.json`, o bien en las variables de entorno SPOTIFY_CLIENT_ID y
SPOTIFY_CLIENT_SECRET.
"""

import base64
import random
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
        self._reintentar_desde = 0.0

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
        espera = self._reintentar_desde - time.monotonic()
        if espera > 0:
            raise RuntimeError(
                f"HTTP 429: espere {int(espera) + 1} segundos antes de consultar Spotify."
            )
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

            if error.code == 429:
                try:
                    espera = max(0, int(error.headers.get("Retry-After", "30")))
                except (ValueError, TypeError, AttributeError):
                    espera = 30
                self._reintentar_desde = time.monotonic() + espera
                raise RuntimeError(
                    f"HTTP 429: {detalle or cuerpo_bruto or error.reason}. "
                    f"Espere {espera} segundos antes de volver a buscar."
                ) from error
            raise RuntimeError(
                f"HTTP {error.code}: {detalle or cuerpo_bruto or error.reason}"
            ) from error

    # ------------------------------------------------------------------ #
    def buscar_canciones(self, consulta, limite=10, mercado="CO", tamano_grupo=50,
                          offset_inicial=0):
        """Muestrea canciones no explícitas de hasta 50 resultados paginados.

        Cada petición obtiene como máximo 10 resultados. El sorteo mejora la
        variedad, pero no garantiza canciones distintas entre búsquedas.

        `offset_inicial` desplaza el punto de partida de la paginación
        dentro de los resultados de Spotify (para no traer siempre el mismo
        grupo de canciones "top" de una consulta y así variar lo que suena
        día a día; el llamador es quien decide ese desplazamiento al azar,
        ver `agente.py`). Si con ese desplazamiento no aparece ninguna
        canción (la consulta tiene pocas coincidencias), se reintenta una
        vez desde el principio.
        """
        if type(limite) is not int or limite < 0:
            raise ValueError("limite debe ser un entero mayor o igual a cero.")
        if type(tamano_grupo) is not int or not 1 <= tamano_grupo <= 50:
            raise ValueError("tamano_grupo debe ser un entero entre 1 y 50.")
        if type(offset_inicial) is not int or offset_inicial < 0:
            raise ValueError("offset_inicial debe ser un entero mayor o igual a cero.")
        if limite == 0:
            return []

        pistas = self._paginar_canciones(consulta, mercado, tamano_grupo, offset_inicial)
        if not pistas and offset_inicial:
            pistas = self._paginar_canciones(consulta, mercado, tamano_grupo, 0)

        canciones = []
        vistos = set()
        for pista in pistas:
            if pista is None or pista.get("explicit"):
                continue  # se excluye todo contenido explícito: uso escolar
            uri = pista.get("uri")
            if not uri or uri in vistos:
                continue
            vistos.add(uri)
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
        if len(canciones) > limite:
            canciones = random.sample(canciones, limite)
        else:
            random.shuffle(canciones)
        return canciones

    # ------------------------------------------------------------------ #
    def _paginar_canciones(self, consulta, mercado, tamano_grupo, offset_inicial):
        """Trae hasta `tamano_grupo` pistas crudas de Spotify en páginas de 10,
        empezando en `offset_inicial`."""
        pistas = []
        offset = offset_inicial
        limite_offset = offset_inicial + tamano_grupo
        while offset < limite_offset:
            cantidad = min(10, limite_offset - offset)
            datos = self._get(
                URL_BUSQUEDA,
                {"q": consulta, "type": "track", "limit": cantidad,
                 "offset": offset, "market": mercado},
            )
            pagina = datos.get("tracks") or {}
            items = pagina.get("items") or []
            pistas.extend(items[:cantidad])
            offset += len(items[:cantidad])
            if not items or not pagina.get("next"):
                break
            if offset < limite_offset:
                time.sleep(0.8)
        return pistas

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
