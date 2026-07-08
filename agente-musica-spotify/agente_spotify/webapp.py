# -*- coding: utf-8 -*-
"""
Aplicación web local del Agente de música Spotify — I.E. La Esperanza.

Se ejecuta en el PC (no necesita internet salvo para consultar Spotify) y
permite:

  - Ver el estado del agente (activo / en espera, próxima activación).
  - Modificar las franjas horarias y los días de ejecución (por defecto,
    lunes a viernes).
  - Guardar las credenciales de Spotify de forma local.
  - Lanzar una búsqueda inmediata y consultar los resultados guardados.

Uso:
    python -m agente_spotify.webapp
    (se abre automáticamente en el navegador: http://127.0.0.1:8000)

Solo usa la librería estándar de Python: no hay que instalar nada.
"""

import argparse
import html
import json
import random
import threading
import time
import urllib.error
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from . import reproductor
from .agente import (
    CARPETA_RESULTADOS,
    ahora_colombia,
    ejecutar_busqueda,
    fin_de_franja,
    franja_activa,
    proxima_activacion,
)
from .configuracion import (
    NOMBRES_DIAS,
    cargar_config,
    cargar_credenciales,
    guardar_config,
    guardar_credenciales,
)
from .generos import GENEROS_AUTORIZADOS
from .spotify_api import ClienteSpotify

# ---------------------------------------------------------------------- #
# Estado compartido entre el planificador y la interfaz web
# ---------------------------------------------------------------------- #
_candado = threading.Lock()
_estado = {
    "buscando": False,
    "progreso": "",
    "ultima_busqueda": None,
    "ultimo_archivo": None,
    "ultimo_error": None,
    "musica_sonando": False,
    "mensaje_musica": None,
}


def _actualizar_estado(**cambios):
    with _candado:
        _estado.update(cambios)


def _leer_estado():
    with _candado:
        return dict(_estado)


# ---------------------------------------------------------------------- #
def _correr_busqueda(origen):
    """Ejecuta una búsqueda completa actualizando el estado compartido."""
    with _candado:
        if _estado["buscando"]:
            return
        _estado["buscando"] = True
        _estado["progreso"] = "Conectando con Spotify..."
        _estado["ultimo_error"] = None
    try:
        cliente = ClienteSpotify()

        def avance(genero, indice, total):
            _actualizar_estado(progreso=f"Buscando {indice}/{total}: {genero}")

        momento = ahora_colombia()
        archivo = ejecutar_busqueda(cliente, momento, al_avanzar=avance)
        _actualizar_estado(
            ultima_busqueda=f"{momento:%Y-%m-%d %I:%M %p} ({origen})",
            ultimo_archivo=archivo.name,
        )
    except Exception as error:  # noqa: BLE001 - se muestra en la interfaz
        _actualizar_estado(ultimo_error=str(error))
    finally:
        _actualizar_estado(buscando=False, progreso="")


def _uris_para_reproducir(config):
    """Canciones (URIs) del último resultado, según los géneros elegidos."""
    archivos = sorted(CARPETA_RESULTADOS.glob("musica_*.json"), reverse=True)
    if not archivos:
        return []
    datos = json.loads(archivos[0].read_text(encoding="utf-8"))
    elegidos = set(config.get("generos_reproduccion") or [])
    uris = []
    for genero in datos.get("generos", []):
        if elegidos and genero["genero"] not in elegidos:
            continue
        uris.extend(
            c["uri"] for c in genero.get("canciones", []) if c.get("uri")
        )
    random.shuffle(uris)
    return uris


def _encender_musica(config, origen):
    """Pone a sonar la música sin intervención humana. Devuelve True si sonó."""
    try:
        uris = _uris_para_reproducir(config)
        if not uris:
            raise RuntimeError(
                "El último resultado no tiene canciones con URI; ejecute una "
                "búsqueda primero."
            )
        aparato = reproductor.iniciar_reproduccion(uris)
        _actualizar_estado(
            musica_sonando=True,
            mensaje_musica=f"🎵 Música sonando en «{aparato}» ({origen}).",
        )
        return True
    except Exception as error:  # noqa: BLE001
        _actualizar_estado(
            musica_sonando=False,
            mensaje_musica=f"No se pudo reproducir: {error}",
        )
        return False


def _apagar_musica():
    try:
        reproductor.pausar()
        _actualizar_estado(
            musica_sonando=False,
            mensaje_musica="⏸ Música detenida (fin de la franja).",
        )
    except Exception as error:  # noqa: BLE001
        _actualizar_estado(musica_sonando=False,
                           mensaje_musica=f"No se pudo pausar: {error}")


class Planificador(threading.Thread):
    """Hilo que activa el agente automáticamente en las franjas configuradas.

    Al iniciar una franja: busca música y, si la reproducción automática está
    activada y hay cuenta conectada, la pone a sonar sin intervención humana.
    Al terminar la franja: detiene la música.
    """

    def __init__(self):
        super().__init__(daemon=True)
        self._ultima_clave = None
        self._sono_en_franja = False

    def run(self):
        while True:
            try:
                config = cargar_config()
                momento = ahora_colombia()
                franja = franja_activa(momento, config)
                auto = (config.get("reproduccion_automatica")
                        and reproductor.hay_cuenta_conectada())
                if franja:
                    clave = f"{momento:%Y-%m-%d}|{franja['inicio']}"
                    if clave != self._ultima_clave:
                        self._ultima_clave = clave
                        self._sono_en_franja = False
                        _correr_busqueda("automática")
                    if auto and not self._sono_en_franja:
                        # reintenta cada ciclo hasta lograr que suene
                        self._sono_en_franja = _encender_musica(
                            config, "activación automática"
                        )
                elif _leer_estado()["musica_sonando"]:
                    _apagar_musica()
            except Exception as error:  # noqa: BLE001
                _actualizar_estado(ultimo_error=str(error))
            time.sleep(20)


# ---------------------------------------------------------------------- #
# Interfaz web
# ---------------------------------------------------------------------- #
ESTILOS = """
:root { font-family: 'Segoe UI', Arial, sans-serif; }
body { margin:0; background:#f4f6f8; color:#20303c; }
header { background:#1DB954; color:#fff; padding:18px 28px; }
header h1 { margin:0; font-size:1.35rem; }
header p { margin:4px 0 0; opacity:.9; font-size:.9rem; }
main { max-width:960px; margin:24px auto; padding:0 16px; display:grid; gap:20px; }
.tarjeta { background:#fff; border-radius:10px; padding:20px 24px;
           box-shadow:0 1px 4px rgba(0,0,0,.08); }
.tarjeta h2 { margin:0 0 12px; font-size:1.05rem; color:#128a40; }
table { border-collapse:collapse; width:100%; }
th, td { text-align:left; padding:6px 10px; border-bottom:1px solid #e4e8eb; font-size:.92rem; }
input[type=time], input[type=text], input[type=password] {
  padding:6px 8px; border:1px solid #c6cdd3; border-radius:6px; font-size:.95rem; }
button { background:#1DB954; color:#fff; border:none; border-radius:6px;
         padding:8px 16px; font-size:.95rem; cursor:pointer; }
button:hover { background:#169c46; }
button.secundario { background:#5b6b78; }
button.peligro { background:#c0392b; padding:4px 10px; }
.estado-activo { color:#128a40; font-weight:700; }
.estado-espera { color:#5b6b78; font-weight:700; }
.error { background:#fdecea; color:#b3271e; padding:10px 14px; border-radius:8px; }
.aviso { background:#e8f7ee; color:#128a40; padding:10px 14px; border-radius:8px; }
.dias label { margin-right:14px; font-size:.95rem; }
a { color:#128a40; }
.fila-franja td { border:none; padding:4px 6px; }
small { color:#5b6b78; }
#reproductor { position:fixed; bottom:0; left:0; right:0; display:none;
  background:#191414; padding:10px 16px; box-shadow:0 -2px 10px rgba(0,0,0,.35); }
#reproductor iframe { width:100%; height:152px; border:0; border-radius:12px; }
#reproductor .cerrar { position:absolute; top:-14px; right:14px; background:#c0392b;
  border-radius:50%; width:28px; height:28px; padding:0; font-weight:700; }
.boton-escuchar { background:#1DB954; color:#fff; border:none; border-radius:14px;
  padding:4px 12px; font-size:.85rem; cursor:pointer; }
"""

GUION_REPRODUCTOR = """
function reproducir(enlace) {
  const m = enlace.match(/open\\.spotify\\.com\\/(intl-[a-z]+\\/)?(track|playlist|album|artist)\\/([A-Za-z0-9]+)/);
  if (!m) { window.open(enlace, '_blank'); return; }
  document.getElementById('marco-reproductor').src =
    'https://open.spotify.com/embed/' + m[2] + '/' + m[3] + '?utm_source=generator&theme=0';
  document.getElementById('reproductor').style.display = 'block';
  document.body.style.paddingBottom = '190px';
}
function cerrarReproductor() {
  document.getElementById('marco-reproductor').src = '';
  document.getElementById('reproductor').style.display = 'none';
  document.body.style.paddingBottom = '0';
}
"""

BARRA_REPRODUCTOR = """
<div id="reproductor">
  <button type="button" class="cerrar" title="Cerrar reproductor"
    onclick="cerrarReproductor()">✕</button>
  <iframe id="marco-reproductor" allow="autoplay; clipboard-write;
    encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
</div>
"""

GUION_JS = """
function agregarFranja(inicio, fin) {
  const tabla = document.getElementById('tabla-franjas');
  const fila = document.createElement('tr');
  fila.className = 'fila-franja';
  fila.innerHTML =
    '<td><input type="time" name="inicio" required value="' + (inicio||'') + '"></td>' +
    '<td><input type="time" name="fin" required value="' + (fin||'') + '"></td>' +
    '<td><button type="button" class="peligro" ' +
    'onclick="this.closest(\\'tr\\').remove()">Quitar</button></td>';
  tabla.appendChild(fila);
}
async function refrescarEstado() {
  try {
    const r = await fetch('/estado.json');
    const e = await r.json();
    document.getElementById('estado-agente').innerHTML = e.html_estado;
  } catch (err) { /* sin conexión momentánea: se reintenta */ }
}
setInterval(refrescarEstado, 10000);
"""


def _html_estado():
    """Fragmento HTML con el estado actual del agente."""
    config = cargar_config()
    momento = ahora_colombia()
    franja = franja_activa(momento, config)
    estado = _leer_estado()
    partes = []

    if estado["buscando"]:
        partes.append(
            f"<p class='estado-activo'>⏳ {html.escape(estado['progreso'] or 'Buscando música...')}</p>"
        )
    elif franja:
        fin = fin_de_franja(momento, franja)
        partes.append(
            f"<p class='estado-activo'>🟢 AGENTE ACTIVO — franja "
            f"{franja['inicio']}–{franja['fin']} (se desactiva a las {fin:%I:%M %p})</p>"
        )
    else:
        proxima = proxima_activacion(momento, config)
        dia = NOMBRES_DIAS[proxima.weekday()] if proxima else "—"
        partes.append(
            "<p class='estado-espera'>⚪ En espera — próxima activación: "
            f"{dia} {proxima:%d/%m a las %I:%M %p}</p>"
        )

    if estado["ultima_busqueda"]:
        enlace = ""
        if estado["ultimo_archivo"]:
            nombre = html.escape(estado["ultimo_archivo"])
            enlace = f" — <a href='/ver/{nombre}'>ver resultados</a>"
        partes.append(
            f"<p><small>Última búsqueda: {html.escape(estado['ultima_busqueda'])}{enlace}</small></p>"
        )
    if estado["mensaje_musica"]:
        clase = "aviso" if estado["musica_sonando"] else "error"
        if estado["mensaje_musica"].startswith("⏸"):
            clase = "aviso"
        partes.append(
            f"<div class='{clase}'>{html.escape(estado['mensaje_musica'])}</div>"
        )
    if estado["ultimo_error"]:
        partes.append(f"<div class='error'>⚠️ {html.escape(estado['ultimo_error'])}</div>")
    partes.append(
        f"<p><small>Hora de Colombia: {NOMBRES_DIAS[momento.weekday()]} "
        f"{momento:%d/%m/%Y, %I:%M %p}</small></p>"
    )
    return "".join(partes)


def _seccion_reproduccion(config):
    """Sección del panel para conectar la cuenta y activar la música sola."""
    if not reproductor.hay_cuenta_conectada():
        return """
  <p>Para que la música <b>suene sola</b> al llegar cada franja, conecte la
  cuenta de Spotify de la institución (una sola vez).</p>
  <ol>
    <li>Requiere cuenta <b>Spotify Premium</b> y la aplicación de Spotify
        abierta en este computador (con sesión iniciada).</li>
    <li>En <a href="https://developer.spotify.com/dashboard" target="_blank">
        developer.spotify.com/dashboard</a> → su aplicación → <i>Settings</i>,
        agregue esta <b>Redirect URI</b> y guarde:
        <code>http://127.0.0.1:8000/callback</code></li>
    <li>Luego pulse el botón:</li>
  </ol>
  <form method="get" action="/autorizar">
    <button type="submit">🔗 Conectar cuenta de Spotify</button>
  </form>"""

    marcados = set(config.get("generos_reproduccion") or [])
    casillas = "".join(
        f"<label style='display:inline-block;width:270px'>"
        f"<input type='checkbox' name='generos' value='{html.escape(g['genero'])}' "
        f"{'checked' if (not marcados or g['genero'] in marcados) else ''}> "
        f"{html.escape(g['genero'])}</label>"
        for g in GENEROS_AUTORIZADOS
    )
    activada = "checked" if config.get("reproduccion_automatica") else ""
    return f"""
  <p class="estado-activo">✔ Cuenta de Spotify conectada.</p>
  <form method="post" action="/guardar-reproduccion">
    <p><label><input type="checkbox" name="activa" {activada}>
      <b>Reproducir música automáticamente al llegar cada franja</b>
      (y detenerla sola al terminar)</label></p>
    <p><small>La música suena en la aplicación de Spotify de este computador:
    manténgala abierta. Géneros que pueden sonar:</small></p>
    <p>{casillas}</p>
    <button type="submit">💾 Guardar reproducción automática</button>
  </form>
  <form method="post" action="/reproducir-ahora" style="display:inline">
    <button type="submit">▶ Probar: sonar ahora</button>
  </form>
  <form method="post" action="/detener-musica" style="display:inline">
    <button type="submit" class="secundario">⏸ Detener música</button>
  </form>
  <form method="post" action="/desconectar-spotify" style="display:inline">
    <button type="submit" class="peligro">Desconectar cuenta</button>
  </form>"""


def _pagina_principal(mensaje=None, error=None):
    config = cargar_config()
    client_id, client_secret = cargar_credenciales()
    hay_credenciales = bool(client_id and client_secret)

    avisos = ""
    if mensaje:
        avisos += f"<div class='aviso'>✅ {html.escape(mensaje)}</div>"
    if error:
        avisos += f"<div class='error'>⚠️ {html.escape(error)}</div>"

    franjas_js = "".join(
        f"agregarFranja('{f['inicio']}', '{f['fin']}');" for f in config["franjas"]
    )
    dias_html = "".join(
        f"<label><input type='checkbox' name='dias' value='{i}' "
        f"{'checked' if i in config['dias'] else ''}> {nombre}</label>"
        for i, nombre in enumerate(NOMBRES_DIAS)
    )

    if CARPETA_RESULTADOS.exists():
        archivos = sorted(CARPETA_RESULTADOS.glob("musica_*.json"), reverse=True)[:30]
    else:
        archivos = []
    if archivos:
        filas = "".join(
            f"<tr><td>{html.escape(a.name)}</td>"
            f"<td><a href='/ver/{html.escape(a.name)}'>Ver</a></td>"
            f"<td><a href='/resultados/{html.escape(a.name)}' download>Descargar JSON</a></td></tr>"
            for a in archivos
        )
        tabla_resultados = f"<table><tr><th>Archivo</th><th></th><th></th></tr>{filas}</table>"
    else:
        tabla_resultados = "<p><small>Aún no hay resultados guardados.</small></p>"

    credencial_estado = (
        "<p class='estado-activo'>✔ Credenciales configuradas.</p>"
        if hay_credenciales
        else "<div class='error'>Aún no hay credenciales de Spotify. "
        "Créelas gratis en <a href='https://developer.spotify.com/dashboard' "
        "target='_blank'>developer.spotify.com/dashboard</a> y péguelas aquí.</div>"
    )

    return f"""<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Agente de música Spotify — I.E. La Esperanza</title>
<style>{ESTILOS}</style>
</head><body>
<header>
  <h1>🎵 Agente de música Spotify — I.E. La Esperanza</h1>
  <p>Busca solo los 22 géneros autorizados, sin contenido explícito.</p>
</header>
<main>
{avisos}

<section class="tarjeta">
  <h2>Estado del agente</h2>
  <div id="estado-agente">{_html_estado()}</div>
  <form method="post" action="/buscar-ahora" style="margin-top:10px">
    <button type="submit">🔍 Buscar música ahora</button>
  </form>
</section>

<section class="tarjeta">
  <h2>Horarios de activación</h2>
  <p><small>El agente se activa en cada franja y se desactiva al terminar.
  Hora de Colombia (America/Bogota).</small></p>
  <form method="post" action="/guardar-horarios">
    <table>
      <tr><th>Se activa</th><th>Se desactiva</th><th></th></tr>
      <tbody id="tabla-franjas"></tbody>
    </table>
    <p><button type="button" class="secundario" onclick="agregarFranja('','')">
      ➕ Agregar franja</button></p>
    <h2>Días de ejecución</h2>
    <p class="dias">{dias_html}</p>
    <button type="submit">💾 Guardar horarios y días</button>
  </form>
</section>

<section class="tarjeta">
  <h2>🔊 Reproducción automática (sin intervención humana)</h2>
  {_seccion_reproduccion(config)}
</section>

<section class="tarjeta">
  <h2>Credenciales de Spotify</h2>
  {credencial_estado}
  <form method="post" action="/guardar-credenciales">
    <p><input type="text" name="client_id" placeholder="Client ID" size="40"
       value="{html.escape(client_id or '')}"></p>
    <p><input type="password" name="client_secret" placeholder="Client Secret" size="40"></p>
    <button type="submit">💾 Guardar y probar credenciales</button>
  </form>
  <p><small>Se guardan solo en este computador (archivo credenciales.json,
  excluido de git).</small></p>
</section>

<section class="tarjeta">
  <h2>Resultados guardados</h2>
  {tabla_resultados}
</section>
</main>
<script>{GUION_JS}{franjas_js}</script>
</body></html>"""


def _pagina_resultado(nombre_archivo):
    ruta = CARPETA_RESULTADOS / nombre_archivo
    datos = json.loads(ruta.read_text(encoding="utf-8"))
    secciones = []
    for genero in datos.get("generos", []):
        filas = "".join(
            f"<tr><td>{html.escape(c.get('nombre') or '')}</td>"
            f"<td>{html.escape(', '.join(c.get('artistas') or []))}</td>"
            f"<td>{c.get('duracion_min', '')} min</td>"
            f"<td><button type='button' class='boton-escuchar' "
            f"onclick=\"reproducir('{html.escape(c.get('enlace') or '')}')\">▶ Escuchar</button> "
            f"<a href='{html.escape(c.get('enlace') or '#')}' target='_blank'><small>Abrir en Spotify</small></a></td></tr>"
            for c in genero.get("canciones", [])
        ) or "<tr><td colspan='4'><small>Sin canciones encontradas.</small></td></tr>"
        listas = "".join(
            f"<li><button type='button' class='boton-escuchar' "
            f"onclick=\"reproducir('{html.escape(p.get('enlace') or '')}')\">▶ Escuchar</button> "
            f"<a href='{html.escape(p.get('enlace') or '#')}' target='_blank'>"
            f"{html.escape(p.get('nombre') or '')}</a> "
            f"<small>({p.get('total_canciones', '?')} canciones)</small></li>"
            for p in genero.get("playlists", [])
        )
        secciones.append(f"""
<section class="tarjeta">
  <h2>{html.escape(genero['genero'])}</h2>
  <p><small>{html.escape(genero.get('caracteristicas', ''))} —
  <b>Uso:</b> {html.escape(genero.get('uso_recomendado', ''))}</small></p>
  <table><tr><th>Canción</th><th>Artistas</th><th>Duración</th><th></th></tr>{filas}</table>
  {f"<p><b>Playlists:</b></p><ul>{listas}</ul>" if listas else ""}
</section>""")

    fecha = html.escape(datos.get("fecha_hora", ""))
    return f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Resultados — {html.escape(nombre_archivo)}</title>
<style>{ESTILOS}</style></head><body>
<header><h1>🎵 Resultados de búsqueda</h1><p>{fecha}</p></header>
<main>
<p><a href="/">← Volver al panel</a></p>
<p class="aviso">🎧 Pulse <b>▶ Escuchar</b> en cualquier canción o playlist para
reproducirla aquí mismo con el reproductor de Spotify. Sin iniciar sesión se
escucha una vista previa; con sesión iniciada en Spotify, la canción completa.</p>
{''.join(secciones)}
</main>
{BARRA_REPRODUCTOR}
<script>{GUION_REPRODUCTOR}</script>
</body></html>"""


# ---------------------------------------------------------------------- #
class Manejador(BaseHTTPRequestHandler):
    server_version = "AgenteSpotifyIE/1.0"

    # --------------------------- utilidades --------------------------- #
    def _responder_html(self, contenido, codigo=200):
        datos = contenido.encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(datos)))
        self.end_headers()
        self.wfile.write(datos)

    def _redirigir(self, destino):
        self.send_response(303)
        self.send_header("Location", destino)
        self.end_headers()

    def _leer_formulario(self):
        longitud = int(self.headers.get("Content-Length", 0))
        cuerpo = self.rfile.read(longitud).decode("utf-8")
        return urllib.parse.parse_qs(cuerpo, keep_blank_values=True)

    def _archivo_seguro(self, nombre):
        """Evita rutas maliciosas: solo archivos musica_*.json de resultados."""
        nombre = urllib.parse.unquote(nombre)
        if "/" in nombre or "\\" in nombre or not nombre.endswith(".json"):
            return None
        ruta = CARPETA_RESULTADOS / nombre
        return ruta if ruta.is_file() else None

    def log_message(self, formato, *args):  # silencia el log por consola
        pass

    # ------------------------------ GET ------------------------------- #
    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        parametros = urllib.parse.parse_qs(url.query)

        if url.path == "/":
            self._responder_html(
                _pagina_principal(
                    mensaje=(parametros.get("msg") or [None])[0],
                    error=(parametros.get("err") or [None])[0],
                )
            )
        elif url.path == "/estado.json":
            datos = json.dumps({"html_estado": _html_estado()}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(datos)))
            self.end_headers()
            self.wfile.write(datos)
        elif url.path == "/autorizar":
            try:
                redirect = f"http://{self.headers.get('Host')}/callback"
                self._redirigir(reproductor.url_autorizacion(redirect))
            except Exception as error:  # noqa: BLE001
                self._redirigir("/?err=" + urllib.parse.quote(str(error)))
        elif url.path == "/callback":
            codigo = (parametros.get("code") or [None])[0]
            estado_oauth = (parametros.get("state") or [None])[0]
            if not codigo:
                detalle = (parametros.get("error") or ["autorización cancelada"])[0]
                self._redirigir("/?err=" + urllib.parse.quote(
                    f"Spotify no autorizó la cuenta: {detalle}"))
                return
            try:
                redirect = f"http://{self.headers.get('Host')}/callback"
                reproductor.intercambiar_codigo(codigo, estado_oauth, redirect)
                self._redirigir("/?msg=" + urllib.parse.quote(
                    "Cuenta de Spotify conectada. Ya puede activar la "
                    "reproducción automática."))
            except Exception as error:  # noqa: BLE001
                self._redirigir("/?err=" + urllib.parse.quote(
                    f"No se pudo conectar la cuenta: {error}"))
        elif url.path.startswith("/ver/"):
            ruta = self._archivo_seguro(url.path[len("/ver/"):])
            if ruta:
                self._responder_html(_pagina_resultado(ruta.name))
            else:
                self._responder_html("<h1>Archivo no encontrado</h1>", 404)
        elif url.path.startswith("/resultados/"):
            ruta = self._archivo_seguro(url.path[len("/resultados/"):])
            if ruta:
                datos = ruta.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(datos)))
                self.end_headers()
                self.wfile.write(datos)
            else:
                self._responder_html("<h1>Archivo no encontrado</h1>", 404)
        else:
            self._responder_html("<h1>Página no encontrada</h1>", 404)

    # ------------------------------ POST ------------------------------ #
    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        formulario = self._leer_formulario()

        if url.path == "/guardar-horarios":
            inicios = formulario.get("inicio", [])
            fines = formulario.get("fin", [])
            dias = [int(d) for d in formulario.get("dias", [])]
            franjas = [
                {"inicio": i, "fin": f} for i, f in zip(inicios, fines) if i or f
            ]
            try:
                config = cargar_config()  # conserva las demás opciones
                config.update({"franjas": franjas, "dias": dias})
                guardar_config(config)
                self._redirigir("/?msg=" + urllib.parse.quote(
                    "Horarios y días guardados correctamente."))
            except ValueError as error:
                self._redirigir("/?err=" + urllib.parse.quote(str(error)))

        elif url.path == "/guardar-credenciales":
            client_id = (formulario.get("client_id") or [""])[0].strip()
            client_secret = (formulario.get("client_secret") or [""])[0].strip()
            if not client_id or not client_secret:
                self._redirigir("/?err=" + urllib.parse.quote(
                    "Debe escribir el Client ID y el Client Secret."))
                return
            try:
                cliente = ClienteSpotify(client_id, client_secret)
                cliente._obtener_token()  # prueba real contra Spotify
                guardar_credenciales(client_id, client_secret)
                self._redirigir("/?msg=" + urllib.parse.quote(
                    "Credenciales válidas y guardadas."))
            except urllib.error.HTTPError:
                # Spotify respondió pero no aceptó las credenciales
                self._redirigir("/?err=" + urllib.parse.quote(
                    "Spotify rechazó esas credenciales. Verifique el Client ID "
                    "y el Client Secret e intente de nuevo."))
            except Exception:  # noqa: BLE001 - sin conexión: se guardan igual
                guardar_credenciales(client_id, client_secret)
                self._redirigir("/?msg=" + urllib.parse.quote(
                    "Credenciales guardadas, pero no se pudieron verificar "
                    "porque no hay conexión con Spotify en este momento."))

        elif url.path == "/guardar-reproduccion":
            config = cargar_config()
            config["reproduccion_automatica"] = "activa" in formulario
            todos = {g["genero"] for g in GENEROS_AUTORIZADOS}
            elegidos = [g for g in formulario.get("generos", []) if g in todos]
            # si están todos marcados se guarda lista vacía (= todos)
            config["generos_reproduccion"] = (
                [] if len(elegidos) == len(todos) else elegidos
            )
            guardar_config(config)
            self._redirigir("/?msg=" + urllib.parse.quote(
                "Reproducción automática guardada."))

        elif url.path == "/reproducir-ahora":
            config = cargar_config()
            if _encender_musica(config, "prueba manual"):
                self._redirigir("/?msg=" + urllib.parse.quote(
                    "¡Música sonando! Revise la aplicación de Spotify."))
            else:
                mensaje = _leer_estado()["mensaje_musica"] or "No se pudo reproducir."
                self._redirigir("/?err=" + urllib.parse.quote(mensaje))

        elif url.path == "/detener-musica":
            _apagar_musica()
            self._redirigir("/?msg=" + urllib.parse.quote("Música detenida."))

        elif url.path == "/desconectar-spotify":
            reproductor.desconectar()
            _actualizar_estado(musica_sonando=False, mensaje_musica=None)
            self._redirigir("/?msg=" + urllib.parse.quote(
                "Cuenta de Spotify desconectada."))

        elif url.path == "/buscar-ahora":
            if _leer_estado()["buscando"]:
                self._redirigir("/?err=" + urllib.parse.quote(
                    "Ya hay una búsqueda en curso; espere a que termine."))
            else:
                threading.Thread(
                    target=_correr_busqueda, args=("manual",), daemon=True
                ).start()
                time.sleep(0.5)  # deja arrancar la búsqueda antes de refrescar
                self._redirigir("/?msg=" + urllib.parse.quote(
                    "Búsqueda iniciada. El estado se actualiza automáticamente."))
        else:
            self._responder_html("<h1>Página no encontrada</h1>", 404)


# ---------------------------------------------------------------------- #
def main():
    parser = argparse.ArgumentParser(
        description="Aplicación web del agente de música Spotify (I.E. La Esperanza)."
    )
    parser.add_argument("--puerto", type=int, default=8000,
                        help="Puerto local (por defecto 8000).")
    parser.add_argument("--sin-navegador", action="store_true",
                        help="No abrir el navegador automáticamente.")
    argumentos = parser.parse_args()

    direccion = ("127.0.0.1", argumentos.puerto)
    url = f"http://127.0.0.1:{argumentos.puerto}"
    try:
        servidor = ThreadingHTTPServer(direccion, Manejador)
    except OSError:
        # Ya hay una copia del agente corriendo: solo se abre el panel.
        print(f"El agente ya está en ejecución. Abriendo el panel: {url}")
        if not argumentos.sin_navegador:
            webbrowser.open(url)
        return

    Planificador().start()
    print(f"Aplicación web del agente iniciada en {url}")
    print("Deje esta ventana abierta: el agente se activa solo en los horarios "
          "configurados (lunes a viernes por defecto). Ctrl+C para salir.")
    if not argumentos.sin_navegador:
        threading.Timer(1.0, webbrowser.open, [url]).start()
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nAplicación detenida.")


if __name__ == "__main__":
    main()
