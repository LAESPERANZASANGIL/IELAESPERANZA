# 🎵 Agente de búsqueda de música en Spotify — I.E. La Esperanza

Agente automático que busca música apta para el entorno escolar en Spotify y
guarda los resultados en archivos JSON. Solo busca los **20 géneros
autorizados** por la institución y **excluye toda canción marcada como
contenido explícito**.

## ⏰ Horarios de activación (hora de Colombia)

| # | Se activa | Se desactiva |
|---|-----------|--------------|
| 1 | 08:30 a.m. | 08:55 a.m. |
| 2 | 10:30 a.m. | 10:40 a.m. |
| 3 | 03:30 p.m. | 03:55 p.m. |

Fuera de esas franjas el agente permanece en espera y no consulta Spotify.

## 🎼 Géneros autorizados

Pop cristiano · Música cristiana contemporánea · Pop latino positivo ·
Balada pop · Música instrumental · Música clásica moderna · Jazz suave ·
Bossa nova · Salsa clásica sana · Merengue tradicional · Cumbia colombiana ·
Vallenato tradicional · Música andina colombiana · Música llanera ·
Música tropical familiar · Gospel · Folk acústico · Pop acústico ·
Música ambiental · Bandas sonoras educativas

La lista completa, con características y uso recomendado de cada género,
está en [`generos.py`](generos.py).

## 🔑 Requisitos

1. **Python 3.9 o superior** (no requiere librerías externas).
2. **Credenciales gratuitas de Spotify**:
   1. Entre a <https://developer.spotify.com/dashboard> e inicie sesión.
   2. Cree una aplicación (botón *Create app*).
   3. Copie el **Client ID** y el **Client Secret**.
3. Defina las credenciales como variables de entorno:

   ```bash
   # Linux / macOS
   export SPOTIFY_CLIENT_ID="su_client_id"
   export SPOTIFY_CLIENT_SECRET="su_client_secret"
   ```

   ```powershell
   # Windows (PowerShell)
   $env:SPOTIFY_CLIENT_ID = "su_client_id"
   $env:SPOTIFY_CLIENT_SECRET = "su_client_secret"
   ```

## ▶️ Cómo ejecutarlo

Desde la raíz del repositorio:

```bash
# Modo agente: queda en espera y se activa solo en las franjas programadas
python -m agente_spotify.agente

# Modo prueba: hace una búsqueda inmediata sin esperar el horario
python -m agente_spotify.agente --ahora
```

El programa debe dejarse corriendo (por ejemplo, al iniciar el computador de
la emisora escolar). Él mismo se activa y desactiva según el horario.

## 📁 Resultados

Cada activación genera un archivo en `agente_spotify/resultados/` con el
formato `musica_AAAAMMDD_HHMM.json`, que contiene por cada género:

- Canciones encontradas (nombre, artistas, álbum, duración y enlace a Spotify).
- Playlists relacionadas (nombre, autor, número de canciones y enlace).

Todos los enlaces abren directamente en Spotify para reproducir la música.

## 🛡️ Filtros de contenido

- Solo se buscan los géneros de la lista autorizada.
- Se descartan automáticamente las canciones marcadas por Spotify como
  **explícitas** (`explicit = true`).
- Las búsquedas se hacen sobre el mercado de Colombia (`market=CO`).
