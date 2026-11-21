import { h, limpiarPantalla, estadoDados } from './ui.js';
import { iniciar, alCambiar, personaje, estado } from './almacen.js';
import { vistaInicio } from './vistas/inicio.js';
import { vistaCreador } from './vistas/creador.js';
import { vistaHoja } from './vistas/hoja.js';
import { vistaPartidas } from './vistas/partidas.js';
import { vistaCompendio } from './vistas/compendio.js';
import { vistaDados } from './vistas/dados.js';
import { vistaContenido } from './vistas/contenido.js';
import { iniciarAlmanaque } from './estacion.js';
import { vistaHome } from './vistas/home.js';
import { vistaAventuras } from './vistas/aventuras.js';

const vista = document.getElementById('vista');
const irA = (hash) => { if (location.hash === hash) ruta(); else location.hash = hash; };

function ruta() {
  limpiarPantalla();
  estadoDados.fisicos = false;
  const [, sec, id, sub] = (location.hash || '#/').slice(1).split('/');
  document.querySelectorAll('.nav-inf a').forEach((a) => a.classList.toggle('sel', a.dataset.sec === (sec === 'pj' || sec === 'crear' || sec === 'contenido' ? 'personajes' : sec === 'aventuras' ? 'partidas' : sec || '')));
  switch (sec) {
    case 'crear': return vistaCreador(vista, irA);
    case 'pj': {
      const pj = personaje(id);
      if (!pj) return vista.replaceChildren(h('p.ayuda', {}, estado.listo ? 'No se encuentra este personaje.' : 'Cargando…'));
      return vistaHoja(vista, pj, irA);
    }
    case 'partidas': return vistaPartidas(vista, irA, id, sub);
    case 'compendio': return vistaCompendio(vista);
    case 'dados': return vistaDados(vista);
    case 'contenido': return vistaContenido(vista, irA, null);
    case 'acerca': return vistaAcerca();
    case 'personajes': return vistaInicio(vista, irA);
    case 'aventuras': return vistaAventuras(vista, irA, id);
    default: return vistaHome(vista, irA);
  }
}

function vistaAcerca() {
  pedirVersion();
  vista.replaceChildren(h('section.acerca', {},
    h('h2', {}, 'La Senda del Errante'),
    h('p', {}, 'Compañero de mesa para la quinta edición (reglas de 2024): crea y revisa personajes, lleva su hoja en la partida y consulta las reglas.'),
    h('h3', {}, 'Licencia del contenido'),
    h('p', {}, 'Esta obra incluye material del System Reference Document 5.2 ("SRD 5.2") de Wizards of the Coast LLC, disponible en https://www.dndbeyond.com/srd. El SRD 5.2 se publica bajo la licencia Creative Commons Atribución 4.0 Internacional (https://creativecommons.org/licenses/by/4.0/legalcode).'),
    h('p.peq', {}, 'Los textos son traducciones y resúmenes propios del SRD 5.2. Esta app no está afiliada ni respaldada por Wizards of the Coast. Dungeons & Dragons es una marca registrada de Wizards of the Coast LLC.'),
    h('h3', {}, 'Actualizaciones'),
    h('p.peq', { id: 'verApp' }, versionApp ? `Versión ${versionApp}` : 'Versión…'),
    h('p.peq', {}, 'La app busca versiones nuevas al abrirla y cada 30 minutos; si hay una, aparece un aviso arriba.'),
    h('button.btn.rojo', { onclick: (e) => recargarApp(e.currentTarget) }, '⟳ Recargar la app'),
    h('p.peq', {}, 'Creado por JDev.'),
  ));
}

window.addEventListener('hashchange', () => { scrollTo(0, 0); ruta(); });
alCambiar(() => {
  const [, sec, , sub] = (location.hash || '#/').split('/');
  if (sec === 'aventuras') { const f = `${estado.listo}|${estado.usuario?.uid || ''}`; if (f !== firmaSesion) { firmaSesion = f; ruta(); } return; } // al entrar o salir de la cuenta
  if (sec === 'crear' || sec === 'compendio' || sec === 'dados' || sec === 'contenido' || !sec) return;
  if (sec === 'partidas' && sub === 'aventura') return; // la aventura no depende de los datos en tiempo real
  if (sec === 'partidas' && (sub === 'cronica' || sub === 'iniciativa') && !mesaCambiada()) return;
  const activo = document.activeElement;
  if (document.querySelector('.modal-fondo') || (activo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activo.tagName))) return;
  ruta();
});

let firmaSesion = '';
// En crónica e iniciativa solo se repinta si cambian los datos de la propia partida (permisos, miembros…)
let firmaMesa = '';
function mesaCambiada() {
  const pid = (location.hash || '').split('/')[2];
  const p = estado.partidas.find((x) => x.id === pid);
  const f = JSON.stringify([p?.escritores, p?.gestoresIni, p?.iniPropia, p?.miembros, p?.nombres, p?.reglas?.dados]);
  const cambio = f !== firmaMesa; firmaMesa = f; return cambio;
}

iniciarAlmanaque();
ruta();
iniciar();

// ---------- Actualizaciones: la app instalada no se recarga sola al volver a ella ----------
let regSW = null;
var versionApp = ''; // var: se usa también desde vistaAcerca antes de esta línea
const habiaControlador = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
function pedirVersion() { try { navigator.serviceWorker?.controller?.postMessage('version'); } catch { /* */ } }
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((r) => { regSW = r; }).catch((e) => console.warn('SW', e));
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (habiaControlador) document.getElementById('actBanner').classList.add('ver'); pedirVersion(); });
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data?.version) { versionApp = e.data.version.replace('senda-', ''); const v = document.getElementById('verApp'); if (v) v.textContent = `Versión ${versionApp}`; } });
  pedirVersion();
}
let ultimaBusqueda = 0;
function buscarActualizacion() {
  if (!regSW || !navigator.onLine || Date.now() - ultimaBusqueda < 60000) return;
  ultimaBusqueda = Date.now(); regSW.update().catch(() => {});
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) buscarActualizacion(); });
setInterval(buscarActualizacion, 30 * 60000);
document.getElementById('actBtn').onclick = () => location.reload();
async function recargarApp(boton) {
  if (boton) boton.textContent = navigator.onLine ? 'Buscando la última versión…' : 'Sin conexión: se recargará la versión guardada';
  try { if (regSW) await Promise.race([regSW.update(), new Promise((r) => setTimeout(r, 6000))]); } catch { /* */ }
  location.reload();
}
