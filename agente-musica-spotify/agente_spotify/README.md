# 🎵 Agente de música Spotify — I.E. La Esperanza

Aplicación web local que busca música apta para el entorno escolar en Spotify.
Solo busca los **20 géneros autorizados** por la institución y **excluye toda
canción marcada como contenido explícito**.

## 📦 Instalación para usuario final (Windows)

Haga **doble clic en `instalar.bat`** (dentro de la carpeta `agente-musica-spotify`).
El instalador hace todo solo:

1. **Instala Python automáticamente** si el computador no lo tiene
   (descarga silenciosa desde python.org).
2. Crea el acceso directo **"Agente de música Spotify"** en el Escritorio.
3. Configura el agente para **arrancar solo al encender el computador**
   (queda en la carpeta de Inicio de Windows, sin ventanas visibles).
4. Inicia la aplicación de inmediato.

## ▶️ Inicio manual (alternativa)

- **Windows:** doble clic en `iniciar_agente.bat` (carpeta `agente-musica-spotify`).
- **Cualquier sistema:** desde la carpeta `agente-musica-spotify` ejecute
  `python -m agente_spotify.webapp`
  (requiere Python 3.9+; no usa librerías externas).

Se abre automáticamente el panel en el navegador: <http://127.0.0.1:8000>.
Si la aplicación ya estaba corriendo, el doble clic solo abre el panel.

## 🔊 Reproducción automática — la música suena sola

Con esta función, al llegar cada franja el agente **busca la música Y la pone
a sonar sin intervención humana**, y la **detiene solo** al terminar la franja.

Requisitos de Spotify (los exige Spotify, no el programa):

- Cuenta **Spotify Premium** de la institución.
- La **aplicación de Spotify abierta** en el computador (sesión iniciada).

Configuración (una sola vez):

1. En <https://developer.spotify.com/dashboard> → su aplicación → *Settings*,
   agregue esta **Redirect URI** y guarde: `http://127.0.0.1:8000/callback`
2. En el panel web, sección **Reproducción automática**, pulse
   **"🔗 Conectar cuenta de Spotify"** e inicie sesión con la cuenta Premium.
3. Marque **"Reproducir música automáticamente al llegar cada franja"**,
   elija los géneros que pueden sonar y guarde.

Desde ese momento la música arranca y se detiene sola en cada franja. El
botón **"▶ Probar: sonar ahora"** permite verificar sin esperar el horario.
El permiso queda en `token_spotify.json` (solo local, excluido de git).

## ⏰ Horarios (editables desde el panel web)

Por defecto, **solo de lunes a viernes**, hora de Colombia:

| # | Se activa | Se desactiva |
|---|-----------|--------------|
| 1 | 08:30 a.m. | 08:55 a.m. |
| 2 | 10:30 a.m. | 10:40 a.m. |
| 3 | 03:30 p.m. | 03:55 p.m. |

Desde el panel se pueden **cambiar las horas, agregar o quitar franjas y
elegir los días** de la semana. Los cambios se guardan en
`agente_spotify/config.json` y se aplican de inmediato, sin reiniciar.

## 🔑 Credenciales de Spotify (una sola vez)

1. Entre a <https://developer.spotify.com/dashboard> e inicie sesión.
2. Cree una aplicación (*Create app*) y copie el **Client ID** y el
   **Client Secret**.
3. Péguelos en la sección **Credenciales de Spotify** del panel web y pulse
   *Guardar y probar credenciales*.

Se guardan únicamente en ese computador (`agente_spotify/credenciales.json`,
excluido de git). **Nunca publique el Client Secret** ni lo suba al
repositorio.

## 🖥️ Qué ofrece el panel web

- **Estado del agente**: activo / en espera, franja actual y próxima
  activación (se actualiza solo cada 10 segundos).
- **Buscar música ahora**: lanza una búsqueda inmediata sin esperar la franja.
- **Horarios y días**: edición completa de las franjas de activación.
- **Resultados guardados**: cada activación genera un archivo
  `musica_AAAAMMDD_HHMM.json` en `agente_spotify/resultados/`, con un visor
  web que muestra canciones y playlists por género, con enlaces directos para
  abrirlas en Spotify.
- **🎧 Escuchar en vivo**: cada canción y playlist tiene un botón
  **▶ Escuchar** que abre el reproductor oficial de Spotify dentro del mismo
  visor. Sin iniciar sesión se escucha una vista previa de 30 segundos; con
  sesión iniciada en Spotify en el navegador, la reproducción completa.

## 🎼 Géneros autorizados

Pop cristiano · Música cristiana contemporánea · Pop latino positivo ·
Balada pop · Música instrumental · Música clásica moderna · Jazz suave ·
Bossa nova · Salsa clásica sana · Merengue tradicional · Cumbia colombiana ·
Vallenato tradicional · Música andina colombiana · Música llanera ·
Música tropical familiar · Gospel · Folk acústico · Pop acústico ·
Música ambiental · Bandas sonoras educativas

La lista completa, con características y uso recomendado de cada género,
está en [`generos.py`](generos.py).

## 🛡️ Filtros y seguridad

- Solo se buscan los géneros de la lista autorizada.
- Se descartan las canciones marcadas por Spotify como **explícitas**.
- Búsquedas sobre el mercado de Colombia (`market=CO`).
- El panel solo es accesible desde el propio computador (127.0.0.1).

## 🧰 Modo consola (opcional)

Si se prefiere sin navegador:

```bash
python -m agente_spotify.agente          # espera las franjas y busca solo
python -m agente_spotify.agente --ahora  # búsqueda inmediata de prueba
```

Usa la misma configuración de horarios y credenciales del panel web.
