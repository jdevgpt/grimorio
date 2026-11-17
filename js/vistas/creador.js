// Asistente de creación (y de introducción de hojas ya hechas)
import { h, toast } from '../ui.js';
import { CARACTERISTICAS, HABILIDADES, CONJUNTO_ESTANDAR, COSTE_PUNTOS, PUNTOS_TOTALES, IDIOMAS_ESTANDAR, IDIOMAS_RAROS, ALINEAMIENTOS, mod, fmt, habilidad } from '../datos/reglas.js';
import { CLASES, clase } from '../datos/clases.js';
import { ESPECIES, especie } from '../datos/especies.js';
import { TRASFONDOS, trasfondo, DOTES, DOTES_ORIGEN, dote } from '../datos/trasfondos.js';
import { arma, armadura } from '../datos/equipo.js';
import { nuevoPersonaje, calcular, validar, caracFinales, contarMejoras, habilidadesEsperadas, periciasMaximas, CAR_IDS, tirar } from '../motor.js';
import { guardar } from '../almacen.js';
import { informeValidacion } from './comun.js';

const PASOS = ['Inicio', 'Clase', 'Trasfondo', 'Especie', 'Características', 'Habilidades', 'Equipo', 'Nivel', 'Resumen'];

let pj, paso, opcEquipo;

export function vistaCreador(cont, irA) {
  if (!pj) reiniciar();
  const dibujar = () => {
    cont.replaceChildren(
      h('div.creador', {},
        h('ol.pasos', {}, PASOS.map((p, i) => h('li' + (i === paso ? '.activo' : i < paso ? '.hecho' : ''), { onclick: () => { if (i <= paso || puedeAvanzar(i)) { paso = i; dibujar(); } } }, h('span', {}, i + 1), h('em', {}, p)))),
        h('section.paso-cuerpo', {}, PINTAR[paso](dibujar)),
        h('div.nav-pasos', {},
          paso > 0 ? h('button.btn', { onclick: () => { paso--; if (paso === 7 && pj.nivel === 1) paso--; dibujar(); scrollTo(0, 0); } }, '← Atrás') : h('button.btn', { onclick: () => { reiniciar(); dibujar(); } }, 'Empezar de nuevo'),
          paso < PASOS.length - 1
            ? h('button.btn.rojo', { onclick: () => { const e = falta(paso); if (e) return toast(e); paso++; if (paso === 7 && pj.nivel === 1) paso++; dibujar(); scrollTo(0, 0); } }, 'Siguiente →')
            : h('button.btn.rojo', { onclick: async () => { finalizar(); await guardar(pj, true); const id = pj.id; pj = null; irA(`#/pj/${id}`); } }, '✦ Crear personaje'),
        ),
      ),
    );
  };
  dibujar();
}

function reiniciar() { pj = nuevoPersonaje(); paso = 0; opcEquipo = { clase: 'A', trasfondo: 'A' }; }
const puedeAvanzar = (i) => { for (let k = paso; k < i; k++) if (falta(k)) return false; return true; };

function falta(i) {
  if (i === 1 && !pj.clase) return 'Elige una clase.';
  if (i === 1 && clase(pj.clase).eleccion1 && !pj.eleccion1) return `Elige ${clase(pj.clase).eleccion1.n.toLowerCase()}.`;
  if (i === 2 && !pj.trasfondo) return 'Elige un trasfondo.';
  if (i === 3 && !pj.especie) return 'Elige una especie.';
  if (i === 3 && especie(pj.especie).opciones && !pj.opcion) return `Elige ${especie(pj.especie).opciones.n.toLowerCase()}.`;
  if (i === 4) {
    const v = Object.values(pj.bonTrasfondo).filter(Boolean).sort().join();
    if (!(v === '1,2' || v === '1,1,1')) return 'Reparte los aumentos del trasfondo (+2/+1 o +1/+1/+1).';
  }
  return null;
}

// ---------- Pasos ----------
const PINTAR = [
  // 0 Inicio
  (re) => [
    h('h2', {}, 'Un nuevo errante'),
    h('p.ayuda', {}, 'Crea un personaje paso a paso con las reglas de 2024, o introduce una hoja que ya tengas: al final la app comprobará si cumple las reglas.'),
    h('div.modo-elegir', {},
      h('button.tarjeta' + (pj.metodo !== 'manual' ? '.sel' : ''), { onclick: () => { if (pj.metodo === 'manual') pj.metodo = 'estandar'; re(); } }, h('strong', {}, '✦ Crear desde cero'), h('span', {}, 'Te guío por las reglas y hago los cálculos.')),
      h('button.tarjeta' + (pj.metodo === 'manual' ? '.sel' : ''), { onclick: () => { pj.metodo = 'manual'; re(); } }, h('strong', {}, '✎ Introducir hoja existente'), h('span', {}, 'Copia tu hoja de papel y la app la revisa.')),
    ),
    campo('Nombre del personaje', h('input', { value: pj.nombre, placeholder: 'p. ej. Aldric el Errante', oninput: (e) => { pj.nombre = e.target.value; } })),
    campo('Jugador', h('input', { value: pj.jugador, oninput: (e) => { pj.jugador = e.target.value; } })),
    h('div.fila2', {},
      campo('Nivel', h('select', { onchange: (e) => { pj.nivel = Number(e.target.value); } }, Array.from({ length: 20 }, (_, i) => h('option', { value: i + 1, selected: pj.nivel === i + 1 }, i + 1)))),
      campo('Alineamiento', h('select', { onchange: (e) => { pj.alineamiento = e.target.value; } }, h('option', { value: '' }, '—'), ALINEAMIENTOS.map((a) => h('option', { selected: pj.alineamiento === a }, a)))),
    ),
  ],
  // 1 Clase
  (re) => [
    h('h2', {}, 'Elige tu clase'),
    h('div.rejilla-tarjetas', {}, CLASES.map((c) => h('button.tarjeta' + (pj.clase === c.id ? '.sel' : ''), { onclick: () => { if (pj.clase !== c.id) { pj.clase = c.id; pj.eleccion1 = null; pj.dotes = pj.dotes.filter((d) => dote(d)?.tipo !== 'estilo'); } re(); } },
      h('strong', {}, c.n), h('span.dg', {}, `d${c.dg} · ${c.prim.join('/')}`), h('span', {}, c.resumen)))),
    pj.clase && detalleClase(clase(pj.clase), re),
  ],
  // 2 Trasfondo
  (re) => [
    h('h2', {}, 'Elige tu trasfondo'),
    h('p.ayuda', {}, 'El trasfondo te da aumentos de característica, una dote de origen, dos habilidades, una herramienta y equipo.'),
    h('div.rejilla-tarjetas', {}, TRASFONDOS.map((t) => h('button.tarjeta' + (pj.trasfondo === t.id ? '.sel' : ''), { onclick: () => { cambiarTrasfondo(t.id); re(); } },
      h('strong', {}, t.n), h('span.dg', {}, t.carac.join(' · ')), h('span', {}, t.d)))),
    pj.trasfondo && (() => {
      const t = trasfondo(pj.trasfondo);
      return h('div.detalle', {},
        dato('Características', t.carac.join(', ')),
        dato('Dote de origen', dote(t.dote).n), h('p.peq', {}, dote(t.dote).d),
        dato('Habilidades', t.habilidades.map((x) => habilidad(x).n).join(', ')),
        dato('Herramienta', t.herramienta),
      );
    })(),
  ],
  // 3 Especie
  (re) => [
    h('h2', {}, 'Elige tu especie'),
    h('div.rejilla-tarjetas', {}, ESPECIES.map((e) => h('button.tarjeta' + (pj.especie === e.id ? '.sel' : ''), { onclick: () => { if (pj.especie !== e.id) { pj.especie = e.id; pj.opcion = null; pj.tam = e.tam[0]; pj.caracConj = null; pj.dotes = pj.dotes.filter((d) => dote(d)?.tipo !== 'origen'); } re(); } },
      h('strong', {}, e.n), h('span.dg', {}, `${e.tam.join(' o ')} · ${String(e.vel).replace('.', ',')} m`), h('span', {}, e.resumen)))),
    pj.especie && detalleEspecie(especie(pj.especie), re),
  ],
  // 4 Características
  (re) => pasoCaracteristicas(re),
  // 5 Habilidades
  (re) => pasoHabilidades(re),
  // 6 Equipo
  (re) => pasoEquipo(re),
  // 7 Nivel
  (re) => pasoNivel(re),
  // 8 Resumen
  (re) => pasoResumen(re),
];

const campo = (et, input) => h('label.campo', {}, h('span', {}, et), input);
const dato = (et, v) => h('p.dato', {}, h('b', {}, et + ': '), v);

function detalleClase(c, re) {
  return h('div.detalle', {},
    h('h3', {}, c.n),
    dato('Dado de golpe', `d${c.dg} (PG a nivel 1: ${c.dg} + mod. Con)`),
    dato('Salvaciones', c.salv.join(', ')),
    dato('Habilidades', `${c.hab.n} de ${c.hab.de === 'todas' ? 'cualquiera' : c.hab.de.map((x) => habilidad(x).n).join(', ')}`),
    dato('Armas', c.armas.map((a) => ({ sencillas: 'sencillas', marciales: 'marciales', marciales_ligeras: 'marciales ligeras', marciales_sutil_ligera: 'marciales sutiles o ligeras' }[a])).join(', ')),
    dato('Armadura', c.armad.length ? c.armad.join(', ') : 'ninguna'),
    c.herr && dato('Herramientas', c.herr),
    c.conj && dato('Conjuros', `con ${c.conj.car} (${c.conj.tipo === 'completo' ? 'lanzador completo' : c.conj.tipo === 'medio' ? 'medio lanzador' : 'magia del pacto'})`),
    c.eleccion1 && h('div.eleccion', {}, h('h4', {}, c.eleccion1.n),
      c.eleccion1.lista.map((o) => h('label.radio', {}, h('input', { type: 'radio', name: 'e1', checked: pj.eleccion1 === o.id, onchange: () => { pj.eleccion1 = o.id; re(); } }), h('b', {}, o.n), ' — ', o.d))),
    c.id === 'guerrero' && eleccionEstilo(re),
    h('h4', {}, 'Rasgos de nivel 1'),
    c.rasgos.filter((r) => r.nv === 1).map((r) => h('p.peq', {}, h('b', {}, r.n + '. '), r.d)),
  );
}

function eleccionEstilo(re) {
  const actual = pj.dotes.find((d) => dote(d)?.tipo === 'estilo');
  return h('div.eleccion', {}, h('h4', {}, 'Estilo de combate'),
    h('select', { onchange: (e) => { pj.dotes = pj.dotes.filter((d) => d !== actual); if (e.target.value) pj.dotes.push(e.target.value); re(); } },
      h('option', { value: '' }, '— elige —'), DOTES.filter((d) => d.tipo === 'estilo').map((d) => h('option', { value: d.id, selected: actual === d.id }, d.n.replace('Estilo de combate: ', '')))),
    actual && h('p.peq', {}, dote(actual).d));
}

function cambiarTrasfondo(id) {
  const ant = trasfondo(pj.trasfondo);
  if (ant) ant.habilidades.forEach((x) => { delete pj.habilidades[x]; });
  pj.trasfondo = id;
  pj.bonTrasfondo = Object.fromEntries(CAR_IDS.map((c) => [c, 0]));
  const t = trasfondo(id);
  t.habilidades.forEach((x) => { pj.habilidades[x] = pj.habilidades[x] || 1; });
  pj.bonTrasfondo[t.carac[0]] = 2; pj.bonTrasfondo[t.carac[1]] = 1;
}

function detalleEspecie(e, re) {
  return h('div.detalle', {},
    h('h3', {}, e.n),
    e.tam.length > 1 && campo('Tamaño', h('select', { onchange: (ev) => { pj.tam = ev.target.value; } }, e.tam.map((t) => h('option', { selected: pj.tam === t }, t)))),
    e.opciones && h('div.eleccion', {}, h('h4', {}, e.opciones.n),
      e.opciones.lista.map((o) => h('label.radio', {}, h('input', { type: 'radio', name: 'op', checked: pj.opcion === o.id, onchange: () => { pj.opcion = o.id; re(); } }), h('b', {}, o.n), o.d ? ' — ' + o.d : ''))),
    e.caracConj && campo('Característica para lanzar sus conjuros', h('select', { onchange: (ev) => { pj.caracConj = ev.target.value; } }, ['INT', 'SAB', 'CAR'].map((c) => h('option', { selected: (pj.caracConj || 'SAB') === c }, c)))),
    e.doteOrigenExtra && h('div.eleccion', {}, h('h4', {}, 'Versátil: dote de origen'),
      h('select', { onchange: (ev) => { pj.dotes = pj.dotes.filter((d) => dote(d)?.tipo !== 'origen'); if (ev.target.value) pj.dotes.push(ev.target.value); re(); } },
        h('option', { value: '' }, '— elige —'), DOTES_ORIGEN.map((d) => h('option', { value: d.id, selected: pj.dotes.includes(d.id) }, d.n)))),
    h('h4', {}, 'Rasgos'),
    e.rasgos.map((r) => h('p.peq', {}, h('b', {}, r.n + (r.nv ? ` (nv ${r.nv})` : '') + '. '), r.d)),
  );
}

function pasoCaracteristicas(re) {
  const t = trasfondo(pj.trasfondo);
  const metodos = pj.metodo === 'manual'
    ? [['manual', 'Valores de mi hoja']]
    : [['estandar', 'Conjunto estándar'], ['puntos', 'Compra de puntos'], ['tirada', 'Tirar dados']];
  const coste = CAR_IDS.reduce((s, c) => s + (COSTE_PUNTOS[pj.base[c]] ?? 99), 0);
  const fin = caracFinales(pj);
  const patron = Object.values(pj.bonTrasfondo).filter(Boolean).length === 3 ? '111' : '21';
  return [
    h('h2', {}, 'Características'),
    h('div.segmentado', {}, metodos.map(([id, n]) => h('button' + (pj.metodo === id ? '.sel' : ''), { onclick: () => { pj.metodo = id; if (id === 'estandar') pj.base = { FUE: 15, DES: 14, CON: 13, INT: 12, SAB: 10, CAR: 8 }; if (id === 'puntos') pj.base = Object.fromEntries(CAR_IDS.map((c) => [c, 8])); re(); } }, n))),
    pj.metodo === 'manual' && h('p.ayuda', {}, 'Escribe la puntuación base (sin el trasfondo ni las mejoras de nivel). Si en tu hoja solo tienes el total, resta tú los aumentos o usa "Ajustes" en la hoja después.'),
    pj.metodo === 'estandar' && h('p.ayuda', {}, 'Asigna 15, 14, 13, 12, 10 y 8. Al elegir un valor, se intercambia con la característica que lo tenía.'),
    pj.metodo === 'puntos' && h('p.ayuda' + (coste > PUNTOS_TOTALES ? '.mal' : ''), {}, `Puntos gastados: ${coste} / ${PUNTOS_TOTALES}. Cada característica entre 8 y 15.`),
    pj.metodo === 'tirada' && h('p.ayuda', {}, h('button.btn.peq', { onclick: () => { CAR_IDS.forEach((c) => { const r = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6)).sort((a, b) => a - b); pj.base[c] = r[1] + r[2] + r[3]; }); re(); } }, '🎲 Tirar 4d6 ×6'), ' Tira 4d6 y quita el menor para cada una. Luego puedes intercambiarlas escribiendo los valores.'),
    h('table.tabla-carac', {},
      h('tr', {}, h('th', {}, ''), h('th', {}, 'Base'), h('th', {}, 'Trasfondo'), h('th', {}, 'Total'), h('th', {}, 'Mod')),
      CARACTERISTICAS.map((c) => h('tr', {},
        h('th', {}, c.n),
        h('td', {}, entradaBase(c.id, re)),
        h('td.c', {}, pj.bonTrasfondo[c.id] ? '+' + pj.bonTrasfondo[c.id] : (t?.carac.includes(c.id) ? '·' : '')),
        h('td.c.grande', {}, fin[c.id] - (pj.mejoras[c.id] || 0)),
        h('td.c', {}, fmt(mod(fin[c.id] - (pj.mejoras[c.id] || 0)))),
      )),
    ),
    t && h('div.eleccion', {},
      h('h4', {}, `Aumentos del trasfondo (${t.carac.join(', ')})`),
      h('div.segmentado', {},
        h('button' + (patron === '21' ? '.sel' : ''), { onclick: () => { pj.bonTrasfondo = Object.fromEntries(CAR_IDS.map((c) => [c, 0])); pj.bonTrasfondo[t.carac[0]] = 2; pj.bonTrasfondo[t.carac[1]] = 1; re(); } }, '+2 y +1'),
        h('button' + (patron === '111' ? '.sel' : ''), { onclick: () => { pj.bonTrasfondo = Object.fromEntries(CAR_IDS.map((c) => [c, t.carac.includes(c) ? 1 : 0])); re(); } }, '+1 a las tres'),
      ),
      patron === '21' && h('div.fila2', {},
        campo('+2 a', h('select', { onchange: (e) => { const uno = CAR_IDS.find((c) => pj.bonTrasfondo[c] === 1); pj.bonTrasfondo = Object.fromEntries(CAR_IDS.map((c) => [c, 0])); pj.bonTrasfondo[e.target.value] = 2; pj.bonTrasfondo[uno && uno !== e.target.value ? uno : t.carac.find((c) => c !== e.target.value)] = 1; re(); } }, t.carac.map((c) => h('option', { selected: pj.bonTrasfondo[c] === 2 }, c)))),
        campo('+1 a', h('select', { onchange: (e) => { const dos = CAR_IDS.find((c) => pj.bonTrasfondo[c] === 2); if (e.target.value === dos) return re(); CAR_IDS.forEach((c) => { if (pj.bonTrasfondo[c] === 1) pj.bonTrasfondo[c] = 0; }); pj.bonTrasfondo[e.target.value] = 1; re(); } }, t.carac.map((c) => h('option', { selected: pj.bonTrasfondo[c] === 1 }, c)))),
      ),
    ),
    clase(pj.clase) && h('p.ayuda', {}, `Consejo: la característica principal de ${clase(pj.clase).n.toLowerCase()} es ${clase(pj.clase).prim.join(' o ')}.`),
  ];
}

function entradaBase(c, re) {
  if (pj.metodo === 'estandar') {
    return h('select', { onchange: (e) => { const v = Number(e.target.value); const otra = CAR_IDS.find((x) => x !== c && pj.base[x] === v); if (otra) pj.base[otra] = pj.base[c]; pj.base[c] = v; re(); } },
      CONJUNTO_ESTANDAR.map((v) => h('option', { value: v, selected: pj.base[c] === v }, v)));
  }
  if (pj.metodo === 'puntos') {
    return h('div.contador', {},
      h('button', { onclick: () => { if (pj.base[c] > 8) pj.base[c]--; re(); } }, '−'),
      h('b', {}, pj.base[c]),
      h('button', { onclick: () => { if (pj.base[c] < 15) pj.base[c]++; re(); } }, '+'));
  }
  return h('input.num', { type: 'number', min: 1, max: 30, value: pj.base[c], onchange: (e) => { pj.base[c] = Number(e.target.value) || 10; re(); } });
}

function pasoHabilidades(re) {
  const c = clase(pj.clase); const t = trasfondo(pj.trasfondo); const e = especie(pj.especie);
  const fijas = new Set(t.habilidades);
  const esperadas = habilidadesEsperadas(pj);
  const elegidas = Object.values(pj.habilidades).filter((v) => v >= 1).length;
  const maxPer = periciasMaximas(pj);
  const pericias = Object.values(pj.habilidades).filter((v) => v === 2).length;
  const deClase = c.hab.de === 'todas' ? HABILIDADES.map((x) => x.id) : c.hab.de;
  const fuentes = [`${t.n}: ${t.habilidades.map((x) => habilidad(x).n).join(', ')} (fijas)`, `${c.n}: elige ${c.hab.n}`];
  if (e.habilidadElegir) fuentes.push(`${e.n} (${e.habilidadElegir.n}): 1 ${e.habilidadElegir.de === 'todas' ? 'cualquiera' : 'de ' + e.habilidadElegir.de.map((x) => habilidad(x).n).join(', ')}`);
  const dotesHab = [t.dote, ...pj.dotes].filter((d) => d === 'habilidoso').length;
  if (dotesHab) fuentes.push(`Dote Habilidoso: ${3 * dotesHab} a elegir`);
  if (pj.clase === 'bardo' && pj.nivel >= 3) fuentes.push('Colegio del Saber: 3 a elegir');
  if (pj.clase === 'barbaro' && pj.nivel >= 3) fuentes.push('Conocimiento primigenio: 1 de la lista de bárbaro');
  return [
    h('h2', {}, 'Habilidades e idiomas'),
    h('ul.fuentes', {}, fuentes.map((f) => h('li', {}, f))),
    h('p.ayuda' + (elegidas > esperadas ? '.mal' : ''), {}, `Competencias: ${elegidas} / ${esperadas}` + (maxPer ? ` · Pericias: ${pericias} / ${maxPer} (toca dos veces)` : '')),
    h('div.lista-hab', {}, HABILIDADES.map((x) => {
      const v = pj.habilidades[x.id] || 0;
      return h('button.hab' + (v === 1 ? '.comp' : v === 2 ? '.pericia' : '') + (fijas.has(x.id) ? '.fija' : ''), {
        onclick: () => {
          const sig = v === 0 ? 1 : v === 1 && maxPer && pericias < maxPer ? 2 : fijas.has(x.id) ? 1 : 0;
          if (sig) pj.habilidades[x.id] = sig; else delete pj.habilidades[x.id];
          re();
        },
      }, h('span.marca', {}, v === 2 ? '◆' : v === 1 ? '●' : '○'), x.n, h('small', {}, x.c), deClase.includes(x.id) && h('i.etq', {}, c.n));
    })),
    h('h3', {}, 'Idiomas'),
    h('p.ayuda', {}, 'Conoces el común y dos idiomas estándar más (tu clase o tus rasgos pueden dar otros).'),
    h('div.chips', {}, [...IDIOMAS_ESTANDAR, ...IDIOMAS_RAROS].map((i) => h('button.chip' + (pj.idiomas.includes(i) ? '.sel' : ''), { onclick: () => { pj.idiomas = pj.idiomas.includes(i) ? pj.idiomas.filter((x) => x !== i) : [...pj.idiomas, i]; re(); } }, i))),
    h('h3', {}, 'Herramientas'),
    campo('Competencias con herramientas (separadas por comas)', h('input', { value: pj.herramientas.join(', ') || [t.herramienta, c.herr].filter(Boolean).join(', '), onchange: (ev) => { pj.herramientas = ev.target.value.split(',').map((s) => s.trim()).filter(Boolean); } })),
  ];
}

function pasoEquipo(re) {
  const c = clase(pj.clase); const t = trasfondo(pj.trasfondo);
  const opciones = (eq, clave) => h('div.opciones-equipo', {}, Object.entries(eq).map(([k, lista]) => h('label.radio.bloque', {},
    h('input', { type: 'radio', name: clave, checked: opcEquipo[clave] === k, onchange: () => { opcEquipo[clave] = k; re(); } }),
    h('b', {}, `Opción ${k}: `), lista.map(nombreItem).join(', '))));
  return [
    h('h2', {}, 'Equipo inicial'),
    pj.metodo === 'manual' && h('p.ayuda', {}, 'Si introduces una hoja existente, puedes saltarte esto y editar el inventario en la hoja.'),
    h('h3', {}, c.n), opciones(c.equipo, 'clase'),
    h('h3', {}, t.n), opciones(t.equipo, 'trasfondo'),
    pj.metodo === 'manual' && h('label.radio', {}, h('input', { type: 'checkbox', checked: opcEquipo.ninguno, onchange: (e) => { opcEquipo.ninguno = e.target.checked; } }), ' No añadir equipo (lo meteré a mano)'),
  ];
}

export function nombreItem(s) {
  const m = s.match(/^(\d+)×(.*)$/); const cant = m ? m[1] + '× ' : ''; const r = m ? m[2] : s;
  if (r.startsWith('po:')) return `${r.slice(3)} po`;
  if (r.startsWith('w:')) return cant + (arma(r.slice(2))?.n || r);
  if (r.startsWith('a:')) return cant + (armadura(r.slice(2))?.n || r);
  return cant + r;
}

export function itemsDesde(lista) {
  const items = []; let po = 0;
  for (const s of lista) {
    const m = s.match(/^(\d+)×(.*)$/); const c = m ? Number(m[1]) : 1; const r = m ? m[2] : s;
    if (r.startsWith('po:')) { po += Number(r.slice(3)); continue; }
    const ref = r.startsWith('w:') || r.startsWith('a:') ? r : null;
    items.push({ n: nombreItem(r), c, ref, equipado: !!ref });
  }
  return { items, po };
}

function pasoNivel(re) {
  const c = clase(pj.clase); const nMej = contarMejoras(pj);
  const puntos = CAR_IDS.reduce((s, k) => s + Number(pj.mejoras[k] || 0), 0);
  const generales = DOTES.filter((d) => d.tipo === 'general' && d.id !== 'mejora_caracteristica');
  const fin = caracFinales(pj);
  return [
    h('h2', {}, `Hasta el nivel ${pj.nivel}`),
    h('h3', {}, 'Puntos de golpe'),
    h('p.ayuda', {}, `Nivel 1: ${c.dg} + Con. Cada nivel siguiente: la media (${c.dg / 2 + 1}) o lo que sacaste en 1d${c.dg}, + Con. Deja en blanco para usar la media.`),
    h('div.tiradas-pg', {}, Array.from({ length: pj.nivel - 1 }, (_, i) => h('label', {}, h('small', {}, `Nv ${i + 2}`), h('input.num', { type: 'number', min: 1, max: c.dg, placeholder: c.dg / 2 + 1, value: pj.pg.tiradas[i] ?? '', onchange: (e) => { pj.pg.tiradas[i] = e.target.value ? Math.min(c.dg, Math.max(1, Number(e.target.value))) : null; } })))),
    h('button.btn.peq', { onclick: () => { pj.pg.tiradas = Array.from({ length: pj.nivel - 1 }, () => tirar(`1d${c.dg}`).total); re(); } }, `🎲 Tirar ${pj.nivel - 1}d${c.dg}`),
    h('h3', {}, 'Mejoras de característica y dotes'),
    h('p.ayuda', {}, `Por tu nivel tienes ${nMej} mejora(s). Cada una da +2 a una característica o +1 a dos (máx. 20), o puedes cambiarla por una dote general.`),
    h('div.fila-mejoras', {}, CAR_IDS.map((k) => h('div.mejora', {}, h('b', {}, k), h('div.contador', {},
      h('button', { onclick: () => { if (pj.mejoras[k] > 0) pj.mejoras[k]--; re(); } }, '−'), h('span', {}, `+${pj.mejoras[k] || 0}`),
      h('button', { onclick: () => { if (fin[k] < 20) pj.mejoras[k] = (pj.mejoras[k] || 0) + 1; re(); } }, '+')), h('small', {}, fin[k])))),
    h('p.ayuda', {}, `Puntos repartidos: ${puntos}`),
    nMej > 0 && h('div.chips', {}, generales.map((d) => h('button.chip' + (pj.dotes.includes(d.id) ? '.sel' : ''), { onclick: () => { pj.dotes = pj.dotes.includes(d.id) ? pj.dotes.filter((x) => x !== d.id) : [...pj.dotes, d.id]; re(); } }, d.n))),
    (['paladin', 'explorador'].includes(pj.clase) || (pj.clase === 'guerrero' && pj.nivel >= 7)) && h('div', {}, h('h3', {}, 'Estilos de combate'),
      h('div.chips', {}, DOTES.filter((d) => d.tipo === 'estilo').map((d) => h('button.chip' + (pj.dotes.includes(d.id) ? '.sel' : ''), { onclick: () => { pj.dotes = pj.dotes.includes(d.id) ? pj.dotes.filter((x) => x !== d.id) : [...pj.dotes, d.id]; re(); } }, d.n.replace('Estilo de combate: ', ''))))),
    pj.nivel >= 19 && h('div', {}, h('h3', {}, 'Don épico'),
      h('div.chips', {}, DOTES.filter((d) => d.tipo === 'epico').map((d) => h('button.chip' + (pj.dotes.includes(d.id) ? '.sel' : ''), { onclick: () => { pj.dotes = pj.dotes.includes(d.id) ? pj.dotes.filter((x) => x !== d.id) : [...pj.dotes, d.id]; re(); } }, d.n)))),
    pj.nivel >= 3 && h('p.ayuda', {}, `Subclase: ${c.subclase.n} (la única incluida en el SRD para ${c.n.toLowerCase()}).`),
  ];
}

function finalizar() {
  if (!pj._equipoHecho && !opcEquipo.ninguno) {
    const a = itemsDesde(clase(pj.clase).equipo[opcEquipo.clase]);
    const b = itemsDesde(trasfondo(pj.trasfondo).equipo[opcEquipo.trasfondo]);
    pj.equipo = [...a.items, ...b.items];
    // Solo una armadura y un escudo equipados
    let cuerpo = false, escudo = false;
    for (const it of pj.equipo) if (it.ref?.startsWith('a:')) { const ar = armadura(it.ref.slice(2)); if (ar.tipo === 'escudo') { it.equipado = !escudo; escudo = true; } else { it.equipado = !cuerpo; cuerpo = true; } }
    pj.monedas.po = a.po + b.po;
  }
  // Conjuros de especie
  const e = especie(pj.especie); const lin = e.opciones?.lista.find((o) => o.id === pj.opcion);
  const nuevos = [];
  if (lin?.conjuros) for (const [nv, n] of lin.conjuros) if (nv <= pj.nivel) nuevos.push({ n, nv: nv === 1 && !/animales/.test(n) ? 0 : nv === 1 ? 1 : nv === 3 ? 1 : 2, prep: true, extra: true, fuente: e.n });
  if (e.id === 'tiflin') nuevos.push({ n: 'Taumaturgia', nv: 0, prep: true, extra: true, fuente: e.n });
  if (pj.clase === 'druida') nuevos.push({ n: 'Hablar con los animales', nv: 1, prep: true, extra: true, siempre: true, fuente: 'Druídico' });
  if (pj.clase === 'explorador') nuevos.push({ n: 'Marca del cazador', nv: 1, prep: true, extra: true, siempre: true, fuente: 'Enemigo predilecto' });
  if (pj.clase === 'paladin' && pj.nivel >= 2) nuevos.push({ n: 'Castigo divino', nv: 1, prep: true, extra: true, siempre: true, fuente: 'Castigo del paladín' });
  pj.conjuros = [...nuevos, ...pj.conjuros.filter((s) => !s.extra)];
  if (!pj.herramientas.length) pj.herramientas = [trasfondo(pj.trasfondo).herramienta, clase(pj.clase).herr].filter(Boolean);
  const c = calcular(pj);
  pj.pg.actual = c.pgMax;
  pj.px = pj.px || 0;
}

function pasoResumen() {
  const copia = JSON.parse(JSON.stringify(pj));
  const anterior = pj; pj = copia; finalizar(); pj = anterior;
  const c = calcular(copia);
  return [
    h('h2', {}, copia.nombre || 'Tu personaje'),
    h('p.subt', {}, `${c.es.n}${c.lin ? ` (${c.lin.n})` : ''} · ${c.cl.n} ${copia.nivel}${copia.nivel >= 3 ? ` · ${c.cl.subclase.n}` : ''} · ${c.tf.n}`),
    h('div.stats-mini', {},
      CARACTERISTICAS.map((k) => h('div.stat', {}, h('small', {}, k.id), h('b', {}, c.car[k.id]), h('span', {}, fmt(c.mod[k.id])))),
    ),
    h('div.stats-mini', {},
      h('div.stat', {}, h('small', {}, 'PG'), h('b', {}, c.pgMax)),
      h('div.stat', {}, h('small', {}, 'CA'), h('b', {}, c.ca)),
      h('div.stat', {}, h('small', {}, 'Inic.'), h('b', {}, fmt(c.iniciativa))),
      h('div.stat', {}, h('small', {}, 'Vel.'), h('b', {}, String(c.vel).replace('.', ',') + ' m')),
      h('div.stat', {}, h('small', {}, 'Comp.'), h('b', {}, fmt(c.pb))),
    ),
    h('h3', {}, 'Comprobación de reglas'),
    informeValidacion(validar(copia)),
  ];
}
