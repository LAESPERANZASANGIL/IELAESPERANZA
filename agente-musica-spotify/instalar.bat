@echo off
rem ================================================================
rem  INSTALADOR - Emisora la voz de la esperanza FM Estereo
rem  Haga doble clic en este archivo. El instalador:
rem    1. Instala Python automaticamente si el PC no lo tiene.
rem    2. Crea el acceso directo "Emisora la voz de la esperanza FM
rem       Estereo" en el Escritorio.
rem    3. Deja el agente iniciando solo cada vez que se enciende
rem       el computador (sin intervencion humana).
rem    4. Inicia la aplicacion de una vez.
rem ================================================================
title Instalador - Emisora la voz de la esperanza FM Estereo
cd /d "%~dp0"
echo.
echo  ==============================================================
echo   INSTALADOR - Emisora la voz de la esperanza FM Estereo
echo  ==============================================================
echo.

rem ---------- Paso 1: Python ----------
echo  [1/4] Verificando Python...
set "PY="
python --version >nul 2>nul && set "PY=python"
if not defined PY py --version >nul 2>nul && set "PY=py"

if defined PY (
    echo        Python encontrado.
    goto accesos
)

echo        Python no esta instalado. Descargando (3-5 minutos)...
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol='Tls12'; Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.12.10/python-3.12.10-amd64.exe' -OutFile \"$env:TEMP\python-instalador.exe\""
if not exist "%TEMP%\python-instalador.exe" (
    echo.
    echo   ERROR: no se pudo descargar Python. Revise la conexion a
    echo   internet e intente de nuevo, o instalelo manualmente desde
    echo   https://www.python.org/downloads/ marcando "Add Python to PATH".
    echo.
    goto fin
)
echo        Instalando Python (espere, puede tardar unos minutos)...
"%TEMP%\python-instalador.exe" /quiet InstallAllUsers=0 PrependPath=1 Include_launcher=1 Include_test=0
del "%TEMP%\python-instalador.exe" >nul 2>nul

rem La nueva instalacion aun no esta en el PATH de esta ventana:
set "PATH=%LOCALAPPDATA%\Programs\Python\Python312;%LOCALAPPDATA%\Programs\Python\Python312\Scripts;%PATH%"
set "PY="
python --version >nul 2>nul && set "PY=python"
if not defined PY py --version >nul 2>nul && set "PY=py"
if not defined PY (
    echo.
    echo   ERROR: Python se instalo pero Windows aun no lo reconoce.
    echo   REINICIE el computador y vuelva a ejecutar instalar.bat
    echo.
    goto fin
)
echo        Python instalado correctamente.

rem ---------- Paso 2: acceso directo en el Escritorio ----------
:accesos
echo  [2/4] Creando acceso directo en el Escritorio...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\Emisora la voz de la esperanza FM Estereo.lnk'); $s.TargetPath = '%~dp0iniciar_agente.bat'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'Emisora la voz de la esperanza FM Estereo'; $s.Save()"

rem ---------- Paso 3: inicio automatico con Windows ----------
echo  [3/4] Configurando inicio automatico al encender el PC...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut($ws.SpecialFolders.Item('Startup') + '\Emisora la voz de la esperanza FM Estereo (automatico).lnk'); $s.TargetPath = '%~dp0iniciar_oculto.vbs'; $s.WorkingDirectory = '%~dp0'; $s.Save()"

rem ---------- Paso 4: iniciar ahora ----------
echo  [4/4] Iniciando la aplicacion...
echo.
echo  ==============================================================
echo   INSTALACION COMPLETADA
echo   - Acceso directo creado en el Escritorio.
echo   - El agente arrancara solo al encender el computador.
echo   - El panel se abre en:  http://127.0.0.1:8000
echo  ==============================================================
echo.
%PY% -m agente_spotify.webapp

:fin
pause
