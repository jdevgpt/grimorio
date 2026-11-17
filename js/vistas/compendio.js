import { h } from '../ui.js';
import { REGLAS_BASICAS, ESTADOS, AGOTAMIENTO, habilidad } from '../datos/reglas.js';
import { CLASES } from '../datos/clases.js';
import { ESPECIES } from '../datos/especies.js';
import { TRASFONDOS, DOTES, dote } from '../datos/trasfondos.js';
import { ARMAS, ARMADURAS, PROPIEDADES, MAESTRIAS } from '../datos/equipo.js';
import { metros } from './comun.js';

const SECCIONES = [
  ['reglas', 'Reglas'], ['estados', 'Estados'], ['clases', 'Clases'], ['especies', 'Especies'],
  ['trasfondos', 'Trasfondos'], ['dotes', 'Dotes'], ['armas', 'Armas'], ['armaduras', 'Armaduras'], ['conjuros', 'Conjuros'],
];
let seccion = 'reglas'; let filtro = '';

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function vistaCompendio(cont) {
  const buscador = h('input.buscador', { type: 'search', placeholder: 'Buscar en todo el compendio…', value: filtro, oninput: (e) => { filtro = e.target.value; pintarResultados(); } });
  const zona = h('div.compendio-cuerpo');
  const pintarResultados = () => zona.replaceChildren(...(filtro.trim().length > 1 ? buscarTodo(filtro) : [pintarSeccion()]).flat());
  const pintar = () => {
    cont.replaceChildren(h('section.compendio', {},
      buscador,
      h('nav.chips.secciones', {}, SECCIONES.map(([id, n]) => h('button.chip' + (seccion === id && !filtro ? '.sel' : ''), { onclick: () => { seccion = id; filtro = ''; buscador.value = ''; pintar(); } }, n))),
      zona,
    ));
    pintarResultados();
  };
  pintar();
}

const entrada = (titulo, sub, cuerpo) => h('details.entrada', {}, h('summary', {}, h('b', {}, titulo), sub ? h('small', {}, ' ' + sub) : ''), h('div.entrada-cuerpo', {}, cuerpo));
const p = (t) => h('p', {}, t);
const dato = (et, v) => h('p.dato', {}, h('b', {}, et + ': '), v);

function todas() {
  return [
    ...REGLAS_BASICAS.map((r) => ({ s: 'reglas', t: r.n, txt: r.d, el: () => entrada(r.n, '', p(r.d)) })),
    ...ESTADOS.map((e) => ({ s: 'estados', t: e.n, txt: e.d, el: () => entrada(e.n, '', p(e.d)) })),
    { s: 'estados', t: 'Agotamiento', txt: AGOTAMIENTO, el: () => entrada('Agotamiento', '', p(AGOTAMIENTO)) },
    ...CLASES.map((c) => ({ s: 'clases', t: c.n, txt: c.resumen + c.rasgos.map((r) => r.n + r.d).join(' ') + c.subclase.rasgos.map((r) => r.n + r.d).join(' '), el: () => entradaClase(c) })),
    ...ESPECIES.map((e) => ({ s: 'especies', t: e.n, txt: e.resumen + e.rasgos.map((r) => r.n + r.d).join(' '), el: () => entrada(e.n, `${e.tam.join('/')} · ${metros(e.vel)}`, [
      p(e.resumen), ...e.rasgos.map((r) => h('p', {}, h('b', {}, r.n + (r.nv ? ` (nv ${r.nv})` : '') + '. '), r.d)),
      e.opciones && h('div', {}, h('h4', {}, e.opciones.n), e.opciones.lista.map((o) => h('p.peq', {}, h('b', {}, o.n), o.d ? ': ' + o.d : ''))),
    ]) })),
    ...TRASFONDOS.map((t) => ({ s: 'trasfondos', t: t.n, txt: t.d, el: () => entrada(t.n, t.carac.join(' · '), [
      p(t.d), dato('Características', t.carac.join(', ')), dato('Dote', dote(t.dote).n),
      dato('Habilidades', t.habilidades.map((x) => habilidad(x).n).join(', ')), dato('Herramienta', t.herramienta),
    ]) })),
    ...DOTES.map((d) => ({ s: 'dotes', t: d.n, txt: d.d, el: () => entrada(d.n, { origen: 'origen', general: 'general (nv 4+)', estilo: 'estilo de combate', epico: 'don épico (nv 19)' }[d.tipo], [d.req && dato('Requisito', d.req), p(d.d)]) })),
    ...ARMAS.map((a) => ({ s: 'armas', t: a.n, txt: a.prop.join(' ') + a.m, el: () => entrada(a.n, `${a.dano}${a.vers ? ` (${a.vers})` : ''} ${a.td.toLowerCase()}`, [
      dato('Categoría', `${a.cat}, ${a.tipo === 'cac' ? 'cuerpo a cuerpo' : 'a distancia'}`), a.rango && dato('Alcance', `${a.rango} m`),
      ...a.prop.map((x) => h('p.peq', {}, PROPIEDADES[x])), h('p.peq', {}, h('b', {}, 'Maestría — '), MAESTRIAS[a.m]), a.nota && p(a.nota),
      dato('Precio', `${a.po} po · ${String(a.kg).replace('.', ',')} kg`),
    ]) })),
    ...ARMADURAS.map((a) => ({ s: 'armaduras', t: a.n, txt: a.tipo, el: () => entrada(a.n, a.tipo, [
      dato('CA', a.tipo === 'escudo' ? '+2' : `${a.base}${a.dex === true ? ' + Des' : a.dex ? ` + Des (máx. ${a.dex})` : ''}`),
      a.fue && dato('Fuerza', `${a.fue} (si no, −3 m de velocidad)`), a.sig && p('Desventaja en Sigilo.'),
      dato('Precio', `${a.po} po · ${String(a.kg).replace('.', ',')} kg`),
    ]) })),
  ];
}

function entradaClase(c) {
  const rasgos = [...c.rasgos].sort((a, b) => a.nv - b.nv).filter((r) => !r.mejora);
  return entrada(c.n, `d${c.dg} · ${c.prim.join('/')}`, [
    p(c.resumen),
    dato('Salvaciones', c.salv.join(', ')),
    dato('Habilidades', `${c.hab.n} de ${c.hab.de === 'todas' ? 'cualquiera' : c.hab.de.map((x) => habilidad(x).n).join(', ')}`),
    dato('Mejoras de característica', `niveles ${c.mejoras.join(', ')}`),
    h('h4', {}, 'Rasgos'),
    rasgos.map((r) => h('p.peq', {}, h('b', {}, `Nv ${r.nv} · ${r.n}. `), r.d)),
    h('h4', {}, `Subclase: ${c.subclase.n}`), p(c.subclase.d),
    c.subclase.rasgos.map((r) => h('p.peq', {}, h('b', {}, `Nv ${r.nv} · ${r.n}. `), r.d)),
  ]);
}

function pintarSeccion() {
  if (seccion === 'conjuros') return h('div.vacio', {}, h('p', {}, '✧ El grimorio de conjuros del SRD llegará en la siguiente fase.'), h('p.peq', {}, 'Mientras tanto, puedes anotar tus conjuros a mano en la hoja.'));
  return h('div', {}, todas().filter((x) => x.s === seccion).map((x) => x.el()));
}

function buscarTodo(q) {
  const n = norm(q.trim());
  const r = todas().filter((x) => norm(x.t).includes(n) || norm(x.txt).includes(n))
    .sort((a, b) => (norm(b.t).includes(n) ? 1 : 0) - (norm(a.t).includes(n) ? 1 : 0));
  return r.length ? r.map((x) => { const el = x.el(); el.querySelector('summary').append(h('i.etq', {}, SECCIONES.find((s) => s[0] === x.s)[1])); return el; }) : [h('p.ayuda', {}, 'Sin resultados.')];
}
