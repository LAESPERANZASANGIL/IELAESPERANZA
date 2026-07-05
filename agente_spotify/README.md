# 🎵 Agente de música Spotify — I.E. La Esperanza

Aplicación web local que busca música apta para el entorno escolar en Spotify.
Solo busca los **20 géneros autorizados** por la institución y **excluye toda
canción marcada como contenido explícito**.

## ▶️ Cómo iniciarla

Requisito único: **Python 3.9 o superior** (<https://www.python.org/downloads/>).
No hay que instalar librerías.

- **Windows:** doble clic en `iniciar_agente.bat` (en la raíz del repositorio).
- **Cualquier sistema:** desde la raíz del repositorio:

  ```bash
  python -m agente_spotify.webapp
  ```

Se abre automáticamente el panel en el navegador: <http://127.0.0.1:8000>.
Deje la ventana del programa abierta: el agente se activa y desactiva solo.

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
