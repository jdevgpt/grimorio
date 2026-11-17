import { h } from './ui.js';
import { iniciar, alCambiar, personaje, estado } from './almacen.js';
import { vistaInicio } from './vistas/inicio.js';
import { vistaCreador } from './vistas/creador.js';
import { vistaHoja } from './vistas/hoja.js';
import { vistaPartidas } from './vistas/partidas.js';
import { vistaCompendio } from './vistas/compendio.js';
import { vistaDados } from './vistas/dados.js';

const vista = document.getElementById('vista');
const irA = (hash) => { if (location.hash === hash) ruta(); else location.hash = hash; };

function ruta() {
  const [, sec, id] = (location.hash || '#/').slice(1).split('/');
  document.querySelectorAll('.nav-inf a').forEach((a) => a.classList.toggle('sel', a.dataset.sec === (sec === 'pj' || sec === 'crear' ? '' : sec || '')));
  switch (sec) {
    case 'crear': return vistaCreador(vista, irA);
    case 'pj': {
      const pj = personaje(id);
      if (!pj) return vista.replaceChildren(h('p.ayuda', {}, estado.listo ? 'No se encuentra este personaje.' : 'Cargando…'));
      return vistaHoja(vista, pj, irA);
    }
    case 'partidas': return vistaPartidas(vista, irA, id);
    case 'compendio': return vistaCompendio(vista);
    case 'dados': return vistaDados(vista);
    case 'acerca': return vistaAcerca();
    default: return vistaInicio(vista, irA);
  }
}

function vistaAcerca() {
  vista.replaceChildren(h('section.acerca', {},
    h('h2', {}, 'La Senda del Errante'),
    h('p', {}, 'Compañero de mesa para la quinta edición (reglas de 2024): crea y revisa personajes, lleva su hoja en la partida y consulta las reglas.'),
    h('h3', {}, 'Licencia del contenido'),
    h('p', {}, 'Esta obra incluye material del System Reference Document 5.2 ("SRD 5.2") de Wizards of the Coast LLC, disponible en https://www.dndbeyond.com/srd. El SRD 5.2 se publica bajo la licencia Creative Commons Atribución 4.0 Internacional (https://creativecommons.org/licenses/by/4.0/legalcode).'),
    h('p.peq', {}, 'Los textos son traducciones y resúmenes propios del SRD 5.2. Esta app no está afiliada ni respaldada por Wizards of the Coast. Dungeons & Dragons es una marca registrada de Wizards of the Coast LLC.'),
    h('p.peq', {}, 'Creado por JDev.'),
  ));
}

window.addEventListener('hashchange', () => { scrollTo(0, 0); ruta(); });
alCambiar(() => {
  const sec = (location.hash || '#/').split('/')[1];
  if (sec === 'crear' || sec === 'compendio' || sec === 'dados') return;
  const activo = document.activeElement;
  if (document.querySelector('.modal-fondo') || (activo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activo.tagName))) return;
  ruta();
});

ruta();
iniciar();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
