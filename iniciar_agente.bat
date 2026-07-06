@echo off
rem Inicia la aplicacion web del Agente de musica Spotify (I.E. La Esperanza)
cd /d "%~dp0"

rem Busca Python instalado (python o el lanzador py)
python --version >nul 2>nul
if not errorlevel 1 (
    python -m agente_spotify.webapp
    goto fin
)
py --version >nul 2>nul
if not errorlevel 1 (
    py -m agente_spotify.webapp
    goto fin
)

echo.
echo  ============================================================
echo   FALTA INSTALAR PYTHON EN ESTE COMPUTADOR
echo  ============================================================
echo.
echo   Opcion 1 (la mas facil):
echo     1. Abra el "Microsoft Store" de Windows.
echo     2. Busque:  Python 3.12
echo     3. Pulse "Instalar" (autor: Python Software Foundation).
echo.
echo   Opcion 2:
echo     1. Entre a  https://www.python.org/downloads/
echo     2. Descargue e instale, MARCANDO la casilla
echo        "Add Python to PATH".
echo.
echo   Cuando termine la instalacion, vuelva a hacer doble clic
echo   en iniciar_agente.bat
echo.

:fin
pause
