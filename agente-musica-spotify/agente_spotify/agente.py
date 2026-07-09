# -*- coding: utf-8 -*-
"""
Agente de búsqueda de música en Spotify — I.E. La Esperanza.

Los horarios y días de activación se leen de config.json (editables desde la
aplicación web, ver webapp.py). Valores por defecto, hora de Colombia:

    1) 08:30 a.m. — 08:55 a.m.
    2) 10:30 a.m. — 10:40 a.m.
    3) 03:30 p.m. — 03:55 p.m.
    Solo de lunes a viernes.

Durante cada franja busca en Spotify únicamente los géneros musicales
autorizados (ver generos.py), excluye canciones con contenido explícito
y guarda los resultados en la carpeta `resultados/`.

Uso:
    python -m agente_spotify.agente              # modo agente por consola
    python -m agente_spotify.agente --ahora      # búsqueda inmediata (prueba)
    python -m agente_spotify.webapp              # aplicación web (recomendado)
"""

import argparse
import datetime as dt
import json
import sys
import time
from pathlib import Path

from .configuracion import NOMBRES_DIAS, cargar_config
from .generos import GENEROS_AUTORIZADOS
from .spotify_api import ClienteSpotify


def _zona_colombia():
    """Zona horaria de Colombia.

    Se intenta usar la base de datos de zonas horarias (America/Bogota); si el
    sistema no la tiene instalada (común en Windows sin el paquete tzdata),
    se usa un desfase fijo de UTC-5. Colombia no cambia de horario, así que
    UTC-5 es siempre correcto.
    """
    try:
        from zoneinfo import ZoneInfo
        return ZoneInfo("America/Bogota")
    except Exception:  # noqa: BLE001 - falta tzdata u otra causa
        return dt.timezone(dt.timedelta(hours=-5), "America/Bogota")


ZONA_HORARIA = _zona_colombia()
CARPETA_RESULTADOS = Path(__file__).resolve().parent / "resultados"


# ---------------------------------------------------------------------- #
def _a_minutos(hora_texto):
    horas, minutos = hora_texto.split(":")
    return int(horas) * 60 + int(minutos)


def ahora_colombia():
    return dt.datetime.now(tz=ZONA_HORARIA)


def franja_activa(momento, config):
    """Devuelve la franja activa ({'inicio':..,'fin':..}) o None."""
    if momento.weekday() not in config["dias"]:
        return None
    minutos = momento.hour * 60 + momento.minute
    for franja in config["franjas"]:
        if _a_minutos(franja["inicio"]) <= minutos < _a_minutos(franja["fin"]):
            return franja
    return None


def proxima_activacion(momento, config):
    """Fecha/hora del próximo inicio de franja en un día activo."""
    for salto in range(0, 8):
        dia = momento + dt.timedelta(days=salto)
        if dia.weekday() not in config["dias"]:
            continue
        minutos_ahora = momento.hour * 60 + momento.minute if salto == 0 else -1
        for franja in config["franjas"]:
            if _a_minutos(franja["inicio"]) > minutos_ahora:
                horas, mins = franja["inicio"].split(":")
                return dia.replace(
                    hour=int(horas), minute=int(mins), second=0, microsecond=0
                )
    return None  # no debería ocurrir: siempre hay al menos un día y una franja


def fin_de_franja(momento, franja):
    horas, minutos = franja["fin"].split(":")
    return momento.replace(
        hour=int(horas), minute=int(minutos), second=0, microsecond=0
    )


# ---------------------------------------------------------------------- #
def ejecutar_busqueda(cliente, momento, al_avanzar=None):
    """Busca todos los géneros autorizados y guarda el resultado en JSON.

    `al_avanzar(genero, indice, total)` es un callback opcional para
    reportar el progreso (lo usa la aplicación web).
    """
    print(f"[{momento:%Y-%m-%d %H:%M}] Iniciando búsqueda de música autorizada...")
    informe = {
        "institucion": "I.E. La Esperanza",
        "fecha_hora": momento.isoformat(),
        "zona_horaria": "America/Bogota",
        "generos": [],
    }

    total = len(GENEROS_AUTORIZADOS)
    for indice, genero in enumerate(GENEROS_AUTORIZADOS, start=1):
        print(f"  → Buscando: {genero['genero']}")
        if al_avanzar:
            al_avanzar(genero["genero"], indice, total)
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
    total_canciones = sum(len(g["canciones"]) for g in informe["generos"])
    print(f"  Listo: {total_canciones} canciones aptas guardadas en {archivo.name}")
    return archivo


# ---------------------------------------------------------------------- #
def modo_agente(cliente):
    """Bucle por consola: duerme fuera de las franjas y busca al iniciar cada una."""
    print("Emisora la voz de la esperanza FM Estéreo")
    while True:
        config = cargar_config()  # se relee para tomar cambios de la web
        momento = ahora_colombia()
        franja = franja_activa(momento, config)
        if franja:
            ejecutar_busqueda(cliente, momento)
            fin = fin_de_franja(momento, franja)
            segundos = max(0, (fin - ahora_colombia()).total_seconds())
            print(f"  Agente activo hasta las {fin:%I:%M %p}. "
                  f"Desactivación en {int(segundos // 60)} min.")
            time.sleep(segundos + 1)
            print(f"[{ahora_colombia():%H:%M}] Agente desactivado. "
                  "Esperando la próxima franja...")
        else:
            proxima = proxima_activacion(momento, config)
            segundos = (proxima - momento).total_seconds()
            print(f"[{momento:%H:%M}] Fuera de horario. Próxima activación: "
                  f"{NOMBRES_DIAS[proxima.weekday()]} {proxima:%d/%m, %I:%M %p}.")
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
