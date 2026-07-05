# -*- coding: utf-8 -*-
"""
Cliente mínimo de la API Web de Spotify (flujo Client Credentials).

Requiere dos variables de entorno (se obtienen gratis en
https://developer.spotify.com/dashboard creando una aplicación):

    SPOTIFY_CLIENT_ID
    SPOTIFY_CLIENT_SECRET
"""

import base64
import os
import time
import urllib.parse
import urllib.request
import json

URL_TOKEN = "https://accounts.spotify.com/api/token"
URL_BUSQUEDA = "https://api.spotify.com/v1/search"


class ClienteSpotify:
    def __init__(self, client_id=None, client_secret=None):
        self.client_id = client_id or os.environ.get("SPOTIFY_CLIENT_ID")
        self.client_secret = client_secret or os.environ.get("SPOTIFY_CLIENT_SECRET")
        if not self.client_id or not self.client_secret:
            raise RuntimeError(
                "Faltan las credenciales de Spotify. Defina las variables de entorno "
                "SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET (ver README del agente)."
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
            url_completa, headers={"Authorization": f"Bearer {token}"}
        )
        with urllib.request.urlopen(peticion, timeout=30) as respuesta:
            return json.loads(respuesta.read().decode("utf-8"))

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
