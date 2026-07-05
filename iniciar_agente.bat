@echo off
rem Inicia la aplicacion web del Agente de musica Spotify (I.E. La Esperanza)
rem Requiere Python 3.9 o superior instalado: https://www.python.org/downloads/
cd /d "%~dp0"
python -m agente_spotify.webapp
pause
