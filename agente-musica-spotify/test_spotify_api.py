"""Pruebas sin conexión: python -m unittest discover -s . -p 'test_spotify_api.py'."""
import io
import json
import unittest
from unittest.mock import Mock, patch
from urllib.error import HTTPError

from agente_spotify.spotify_api import ClienteSpotify


def pista(i, explicit=False):
    return {"uri": f"spotify:track:{i}", "explicit": explicit, "name": str(i)}


class BusquedaTests(unittest.TestCase):
    def setUp(self):
        self.cliente = ClienteSpotify("prueba", "prueba")

    def buscar(self, items, **kwargs):
        def pagina(url, params):
            self.assertLessEqual(params["limit"], 10)
            self.assertEqual(params["market"], "CO")
            start = params["offset"]
            end = start + params["limit"]
            return {"tracks": {"items": items[start:end],
                               "next": "siguiente" if end < len(items) else None}}
        self.cliente._get = Mock(side_effect=pagina)
        with patch("agente_spotify.spotify_api.time.sleep"):
            return self.cliente.buscar_canciones("genero", **kwargs)

    def test_cantidades_y_paginacion(self):
        for n in (0, 5, 10, 50):
            with self.subTest(n=n):
                result = self.buscar([pista(i) for i in range(n)])
                self.assertEqual(len(result), min(n, 10))
                self.assertEqual(len({x["uri"] for x in result}), len(result))
                self.assertEqual(self.cliente._get.call_count, max(1, (n + 9) // 10))
                offsets = [c.args[1]["offset"] for c in self.cliente._get.call_args_list]
                self.assertEqual(offsets, list(range(0, max(n, 1), 10)))

    def test_filtro_antes_de_seleccionar_y_duplicados(self):
        items = [pista(i, True) for i in range(20)]
        items += [None, {}, pista(99), pista(99)] + [pista(i) for i in range(30, 50)]
        result = self.buscar(items)
        self.assertEqual(len(result), 10)
        self.assertTrue(all(x["uri"] not in {f"spotify:track:{i}" for i in range(20)}
                            for x in result))

    def test_todos_explicitos(self):
        self.assertEqual(self.buscar([pista(i, True) for i in range(50)]), [])

    def test_grupo_parcial_y_limite_mayor(self):
        result = self.buscar([pista(i) for i in range(50)], tamano_grupo=23, limite=40)
        self.assertEqual(len(result), 23)
        self.assertEqual([c.args[1]["limit"] for c in self.cliente._get.call_args_list],
                         [10, 10, 3])

    def test_cero_no_consulta(self):
        self.cliente._get = Mock()
        self.assertEqual(self.cliente.buscar_canciones("x", limite=0), [])
        self.cliente._get.assert_not_called()

    def test_parametros_invalidos(self):
        for kwargs in ({"limite": -1}, {"limite": 1.5}, {"tamano_grupo": 0},
                       {"tamano_grupo": 51}, {"tamano_grupo": True}):
            with self.subTest(kwargs=kwargs), self.assertRaises(ValueError):
                self.cliente.buscar_canciones("x", **kwargs)

    def test_pagina_vacia_con_next_no_produce_bucle(self):
        self.cliente._get = Mock(return_value={"tracks": {"items": [], "next": "x"}})
        self.assertEqual(self.cliente.buscar_canciones("x"), [])
        self.assertEqual(self.cliente._get.call_count, 1)

    def test_error_pagina_posterior_se_propaga(self):
        self.cliente._get = Mock(side_effect=[
            {"tracks": {"items": [pista(i) for i in range(10)], "next": "x"}},
            RuntimeError("HTTP 429")])
        with patch("agente_spotify.spotify_api.time.sleep"), self.assertRaisesRegex(
                RuntimeError, "429"):
            self.cliente.buscar_canciones("x")


class HttpTests(unittest.TestCase):
    def setUp(self):
        self.cliente = ClienteSpotify("prueba", "prueba")
        self.cliente._obtener_token = Mock(return_value="token-de-prueba")

    def error(self, code, body, headers=None):
        return HTTPError("https://api.spotify.com/v1/search", code, "Forbidden",
                         headers or {}, io.BytesIO(body.encode()))

    def test_403_conserva_json_texto_y_vacio(self):
        for body, esperado in (
            ('{"error":{"message":"Acceso denegado","reason":"permiso"}}', "Acceso denegado permiso"),
            ("Acceso restringido", "Acceso restringido"),
            ("", "Forbidden"),
        ):
            with self.subTest(body=body), patch(
                "agente_spotify.spotify_api.urllib.request.urlopen",
                side_effect=self.error(403, body)
            ) as request:
                with self.assertRaisesRegex(RuntimeError, esperado) as caught:
                    self.cliente._get("https://api.spotify.com/v1/search", {})
                self.assertNotIn("10-15", str(caught.exception))
                self.assertEqual(request.call_count, 1)

    def test_429_bloquea_hasta_retry_after_y_luego_recupera(self):
        with patch("agente_spotify.spotify_api.time.monotonic", return_value=100), patch(
            "agente_spotify.spotify_api.urllib.request.urlopen",
            side_effect=self.error(429, "Límite alcanzado", {"Retry-After": "12"})
        ) as request:
            with self.assertRaisesRegex(RuntimeError, "12 segundos"):
                self.cliente._get("https://api.spotify.com/v1/search", {})
            with self.assertRaisesRegex(RuntimeError, "429"):
                self.cliente._get("https://api.spotify.com/v1/search", {})
            self.assertEqual(request.call_count, 1)
        with patch("agente_spotify.spotify_api.time.monotonic", return_value=113), patch(
            "agente_spotify.spotify_api.urllib.request.urlopen"
        ) as request:
            request.return_value.__enter__.return_value.read.return_value = b'{"ok":true}'
            self.assertEqual(self.cliente._get("https://api.spotify.com/v1/search", {}), {"ok": True})

    def test_429_cabecera_ausente_o_invalida(self):
        for headers in ({}, {"Retry-After": "invalid"}):
            with self.subTest(headers=headers), patch(
                "agente_spotify.spotify_api.time.monotonic", return_value=100
            ), patch("agente_spotify.spotify_api.urllib.request.urlopen",
                     side_effect=self.error(429, "", headers)):
                self.cliente._reintentar_desde = 0
                with self.assertRaisesRegex(RuntimeError, "30 segundos"):
                    self.cliente._get("https://api.spotify.com/v1/search", {})
                self.assertEqual(self.cliente._reintentar_desde, 130)


if __name__ == "__main__":
    unittest.main()
