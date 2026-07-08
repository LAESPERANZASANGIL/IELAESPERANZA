# -*- coding: utf-8 -*-
"""
Configuración persistente del agente: franjas horarias, días activos
y credenciales de Spotify.

- config.json       → horarios y días (editable desde la aplicación web)
- credenciales.json → Client ID y Client Secret de Spotify (NO se sube a git)
"""

import json
import os
from pathlib import Path

CARPETA = Path(__file__).resolve().parent
RUTA_CONFIG = CARPETA / "config.json"
RUTA_CREDENCIALES = CARPETA / "credenciales.json"

NOMBRES_DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes",
                "Sábado", "Domingo"]

# Valores por defecto: las tres franjas institucionales, de lunes a viernes.
CONFIG_POR_DEFECTO = {
    "franjas": [
        {"inicio": "08:30", "fin": "08:55"},
        {"inicio": "10:30", "fin": "10:40"},
        {"inicio": "15:30", "fin": "15:55"},
    ],
    # 0 = lunes ... 6 = domingo (igual que datetime.weekday())
    "dias": [0, 1, 2, 3, 4],
    # Reproducción automática al llegar cada franja (requiere Spotify Premium)
    "reproduccion_automatica": False,
    # Géneros que pueden sonar; lista vacía = todos los autorizados
    "generos_reproduccion": [],
}


# ---------------------------------------------------------------------- #
def _hora_valida(texto):
    try:
        horas, minutos = texto.split(":")
        return 0 <= int(horas) <= 23 and 0 <= int(minutos) <= 59
    except (ValueError, AttributeError):
        return False


def validar_config(config):
    """Devuelve una configuración saneada o lanza ValueError."""
    franjas = []
    for franja in config.get("franjas", []):
        inicio, fin = franja.get("inicio", ""), franja.get("fin", "")
        if not (_hora_valida(inicio) and _hora_valida(fin)):
            raise ValueError(f"Hora inválida en la franja {inicio}–{fin}.")
        if inicio >= fin:
            raise ValueError(
                f"La franja {inicio}–{fin} es inválida: la hora de inicio "
                "debe ser anterior a la hora de fin."
            )
        franjas.append({"inicio": inicio, "fin": fin})
    if not franjas:
        raise ValueError("Debe existir al menos una franja horaria.")
    franjas.sort(key=lambda f: f["inicio"])

    dias = sorted({int(d) for d in config.get("dias", []) if 0 <= int(d) <= 6})
    if not dias:
        raise ValueError("Debe seleccionar al menos un día de la semana.")
    return {
        "franjas": franjas,
        "dias": dias,
        "reproduccion_automatica": bool(config.get("reproduccion_automatica", False)),
        "generos_reproduccion": [
            g for g in config.get("generos_reproduccion", []) if isinstance(g, str)
        ],
    }


def cargar_config():
    if RUTA_CONFIG.exists():
        try:
            return validar_config(
                json.loads(RUTA_CONFIG.read_text(encoding="utf-8"))
            )
        except (ValueError, json.JSONDecodeError):
            pass  # archivo dañado: se vuelve a los valores por defecto
    return json.loads(json.dumps(CONFIG_POR_DEFECTO))


def guardar_config(config):
    config = validar_config(config)
    RUTA_CONFIG.write_text(
        json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return config


# ---------------------------------------------------------------------- #
def cargar_credenciales():
    """Busca credenciales en credenciales.json o en variables de entorno."""
    if RUTA_CREDENCIALES.exists():
        try:
            datos = json.loads(RUTA_CREDENCIALES.read_text(encoding="utf-8"))
            if datos.get("client_id") and datos.get("client_secret"):
                return datos["client_id"], datos["client_secret"]
        except json.JSONDecodeError:
            pass
    client_id = os.environ.get("SPOTIFY_CLIENT_ID")
    client_secret = os.environ.get("SPOTIFY_CLIENT_SECRET")
    if client_id and client_secret:
        return client_id, client_secret
    return None, None


def guardar_credenciales(client_id, client_secret):
    RUTA_CREDENCIALES.write_text(
        json.dumps(
            {"client_id": client_id.strip(), "client_secret": client_secret.strip()},
            indent=2,
        ),
        encoding="utf-8",
    )
