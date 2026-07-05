# -*- coding: utf-8 -*-
"""
Agente de búsqueda de música en Spotify — I.E. La Esperanza.

Se activa automáticamente SOLO en estas franjas (hora de Colombia):

    1) 08:30 a.m. — 08:55 a.m.
    2) 10:30 a.m. — 10:40 a.m.
    3) 03:30 p.m. — 03:55 p.m.

Durante cada franja busca en Spotify únicamente los géneros musicales
autorizados (ver generos.py), excluye canciones con contenido explícito
y guarda los resultados en la carpeta `resultados/`.

Uso:
    python -m agente_spotify.agente              # modo agente: espera cada franja
    python -m agente_spotify.agente --ahora      # ejecuta una búsqueda inmediata (prueba)
"""

import argparse
import datetime as dt
import json
import sys
import time
from pathlib import Path
from zoneinfo import ZoneInfo

from .generos import GENEROS_AUTORIZADOS
from .spotify_api import ClienteSpotify

ZONA_HORARIA = ZoneInfo("America/Bogota")
CARPETA_RESULTADOS = Path(__file__).resolve().parent / "resultados"

# Franjas de activación: (hora_inicio, min_inicio, hora_fin, min_fin)
FRANJAS = [
    ((8, 30), (8, 55)),
    ((10, 30), (10, 40)),
    ((15, 30), (15, 55)),
]


# ---------------------------------------------------------------------- #
def ahora_colombia():
    return dt.datetime.now(tz=ZONA_HORARIA)


def franja_activa(momento):
    """Devuelve la franja activa en este momento, o None."""
    minutos = momento.hour * 60 + momento.minute
    for inicio, fin in FRANJAS:
        if inicio[0] * 60 + inicio[1] <= minutos < fin[0] * 60 + fin[1]:
            return (inicio, fin)
    return None


def proxima_activacion(momento):
    """Calcula la fecha/hora del próximo inicio de franja."""
    minutos = momento.hour * 60 + momento.minute
    for inicio, _ in FRANJAS:
        if minutos < inicio[0] * 60 + inicio[1]:
            return momento.replace(
                hour=inicio[0], minute=inicio[1], second=0, microsecond=0
            )
    # Ya pasaron todas las franjas de hoy: primera franja de mañana
    manana = momento + dt.timedelta(days=1)
    inicio = FRANJAS[0][0]
    return manana.replace(hour=inicio[0], minute=inicio[1], second=0, microsecond=0)


# ---------------------------------------------------------------------- #
def ejecutar_busqueda(cliente, momento):
    """Busca todos los géneros autorizados y guarda el resultado en JSON."""
    print(f"[{momento:%Y-%m-%d %H:%M}] Iniciando búsqueda de música autorizada...")
    informe = {
        "institucion": "I.E. La Esperanza",
        "fecha_hora": momento.isoformat(),
        "zona_horaria": "America/Bogota",
        "generos": [],
    }

    for genero in GENEROS_AUTORIZADOS:
        print(f"  → Buscando: {genero['genero']}")
        try:
            canciones = cliente.buscar_canciones(genero["consulta"])
            playlists = cliente.buscar_playlists(genero["consulta"])
        except Exception as error:  # noqa: BLE001 - se registra y continúa
            print(f"    ¡Error consultando Spotify!: {error}", file=sys.stderr)
            canciones, playlists = [], []
        informe["generos"].append(
            {
                "genero": genero["genero"],
                "caracteristicas": genero["caracteristicas"],
                "uso_recomendado": genero["uso_recomendado"],
                "canciones": canciones,
                "playlists": playlists,
            }
        )
        time.sleep(0.3)  # pausa corta para respetar los límites de la API

    CARPETA_RESULTADOS.mkdir(parents=True, exist_ok=True)
    archivo = CARPETA_RESULTADOS / f"musica_{momento:%Y%m%d_%H%M}.json"
    archivo.write_text(
        json.dumps(informe, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    total = sum(len(g["canciones"]) for g in informe["generos"])
    print(f"  Listo: {total} canciones aptas guardadas en {archivo.name}")
    return archivo


# ---------------------------------------------------------------------- #
def modo_agente(cliente):
    """Bucle principal: duerme fuera de las franjas y busca al iniciar cada una."""
    print("Agente de música Spotify — I.E. La Esperanza")
    print("Franjas de activación (hora de Colombia): "
          "08:30–08:55, 10:30–10:40 y 15:30–15:55.")
    while True:
        momento = ahora_colombia()
        franja = franja_activa(momento)
        if franja:
            fin = franja[1]
            ejecutar_busqueda(cliente, momento)
            # Espera a que termine la franja para desactivarse
            fin_franja = momento.replace(
                hour=fin[0], minute=fin[1], second=0, microsecond=0
            )
            segundos = max(0, (fin_franja - ahora_colombia()).total_seconds())
            print(f"  Agente activo hasta las {fin_franja:%I:%M %p}. "
                  f"Desactivación en {int(segundos // 60)} min.")
            time.sleep(segundos + 1)
            print(f"[{ahora_colombia():%H:%M}] Agente desactivado. "
                  "Esperando la próxima franja...")
        else:
            proxima = proxima_activacion(momento)
            segundos = (proxima - momento).total_seconds()
            print(f"[{momento:%H:%M}] Fuera de horario. "
                  f"Próxima activación: {proxima:%Y-%m-%d %I:%M %p}.")
            time.sleep(min(segundos, 300))  # revisa el reloj al menos cada 5 min


# ---------------------------------------------------------------------- #
def main():
    parser = argparse.ArgumentParser(
        description="Agente de búsqueda de música en Spotify para la I.E. La Esperanza."
    )
    parser.add_argument(
        "--ahora",
        action="store_true",
        help="Ejecuta una búsqueda inmediata sin esperar la franja (modo prueba).",
    )
    argumentos = parser.parse_args()

    cliente = ClienteSpotify()
    if argumentos.ahora:
        ejecutar_busqueda(cliente, ahora_colombia())
    else:
        modo_agente(cliente)


if __name__ == "__main__":
    main()
