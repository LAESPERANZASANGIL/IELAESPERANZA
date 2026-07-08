' Inicia el agente en segundo plano (sin ventana) al encender el PC.
' Lo usa el acceso directo de la carpeta de Inicio de Windows.
Set fso = CreateObject("Scripting.FileSystemObject")
Set ws = CreateObject("WScript.Shell")
ws.CurrentDirectory = fso.GetParentFolderName(WScript.ScriptFullName)
ws.Run "cmd /c python -m agente_spotify.webapp --sin-navegador || py -m agente_spotify.webapp --sin-navegador", 0, False
