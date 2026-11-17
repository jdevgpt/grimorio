// Editor del contenido de vuestro libro (trasfondos, especies y dotes que no están en el SRD)
import { h, toast, modal, confirmar } from '../ui.js';
import { CARACTERISTICAS, HABILIDADES } from '../datos/reglas.js';
import { DOTES, TRASFONDOS } from '../datos/trasfondos.js';
import { ESPECIES } from '../datos/especies.js';
import { leerPersonal, guardarPersonal, nuevoId, VACIO, quitarRegistro, registrar } from '../datos/personalizado.js';
import { actualizarPartida, soyDMDe } from '../almacen.js';

const TIPOS = [['trasfondos', 'Trasfondos', 'trasfondo'], ['especies', 'Especies', 'especie'], ['dotes', 'Dotes', 'dote']];

export function vistaContenido(cont, irA, partida) {
  const esMesa = !!partida;
  const editable = !esMesa || soyDMDe(partida);
  const leer = () => (esMesa ? { ...VACIO(), ...(partida.contenido || {}) } : leerPersonal());
  const escribir = async (c) => {
    if (esMesa) { await actualizarPartida(partida.id, { contenido: c }); registrar(c); } else guardarPersonal(c);
  };
  let datos = leer();

  const pintar = () => cont.replaceChildren(h('section.contenido', {},
    esMesa ? h('button.btn.peq', { onclick: () => irA(`#/partidas/${partida.id}`) }, '← ' + partida.nombre) : h('button.btn.peq', { onclick: () => irA('#/') }, '← Personajes'),
    h('h2', {}, esMesa ? 'Contenido de la mesa' : 'Contenido de mi libro'),
    h('p.ayuda', {}, 'El SRD gratuito solo incluye parte del Manual del Jugador de 2024 (9 especies, 4 trasfondos y algunas dotes). Aquí podéis añadir lo que tengáis en vuestro libro y aparecerá en el creador de personajes y en el comprobador de reglas.'),
    esMesa ? h('p.peq', {}, editable ? 'Lo que añadas aquí lo verán todos los jugadores de la partida al crear o editar personajes.' : 'Lo ha añadido tu DM para esta partida.')
      : h('p.peq', {}, 'Esto se guarda en este dispositivo. Si eres DM, mejor créalo dentro de la partida para que lo tenga toda la mesa.'),
    TIPOS.map(([k, titulo, uno]) => h('div.cont-bloque', {},
      h('h3', {}, titulo),
      (datos[k] || []).length ? h('div.lista-cont', {}, datos[k].map((x, i) => h('div.item', {},
        h('span.item-n', {}, h('b', {}, x.n), h('small', {}, ' ' + resumen(k, x))),
        editable && h('button.btn.peq', { onclick: () => editar(k, x, i) }, 'Editar'),
        editable && h('button.x', { onclick: async () => { if (await confirmar('Borrar', `¿Borrar «${x.n}»? Los personajes que ya lo usan conservan su copia.`, 'Borrar')) { datos[k].splice(i, 1); quitarRegistro(k, x.id); await escribir(datos); pintar(); } } }, '×'),
      ))) : h('p.peq', {}, `Ningún ${uno} añadido.`),
      editable && h('button.btn', { onclick: () => editar(k, null) }, `+ Añadir ${uno}`),
    )),
  ));

  async function editar(k, x, i) {
    const nuevo = await formulario(k, x ? JSON.parse(JSON.stringify(x)) : { id: nuevoId(k.slice(0, 3)), origen: esMesa ? 'mesa' : 'libro' });
    if (!nuevo) return;
    if (i != null) datos[k][i] = nuevo; else datos[k] = [...(datos[k] || []), nuevo];
    await escribir(datos); toast(`«${nuevo.n}» guardado.`); pintar();
  }

  pintar();
}

function resumen(k, x) {
  if (k === 'trasfondos') return `${(x.carac || []).join(' · ')} · ${DOTES.find((d) => d.id === x.dote)?.n || 'sin dote'}`;
  if (k === 'especies') return `${(x.tam || []).join('/')} · ${String(x.vel || 9).replace('.', ',')} m`;
  return x.tipo === 'general' ? 'general (nv 4+)' : 'de origen';
}

const campo = (et, input, ayuda) => h('label.campo', {}, h('span', {}, et), input, ayuda ? h('small', {}, ayuda) : null);

async function formulario(k, x) {
  const cuerpo = h('div.form-cont');
  const val = { ...x };
  const texto = (clave, ph = '', area = false) => h(area ? 'textarea' : 'input', { value: val[clave] || '', placeholder: ph, rows: area ? 3 : undefined, oninput: (e) => { val[clave] = e.target.value; } });
  const chips = (clave, opciones, max) => h('div.chips', {}, opciones.map(([v, t]) => {
    const b = h('button.chip' + ((val[clave] || []).includes(v) ? '.sel' : ''), { onclick: () => {
      const arr = val[clave] || [];
      if (arr.includes(v)) val[clave] = arr.filter((y) => y !== v);
      else if (!max || arr.length < max) val[clave] = [...arr, v];
      else return toast(`Máximo ${max}.`);
      b.classList.toggle('sel');
    } }, t);
    return b;
  }));
  const hab = HABILIDADES.map((x2) => [x2.id, x2.n]);

  if (k === 'trasfondos') {
    cuerpo.append(
      campo('Nombre', texto('n', 'p. ej. Granjero')),
      campo('Descripción (opcional)', texto('d', '', true)),
      campo('Características que puede aumentar (elige 3)', chips('carac', CARACTERISTICAS.map((c) => [c.id, c.n]), 3)),
      campo('Dote de origen', h('select', { onchange: (e) => { val.dote = e.target.value; } }, h('option', { value: '' }, '— elige —'),
        DOTES.filter((d) => d.tipo === 'origen').map((d) => h('option', { value: d.id, selected: val.dote === d.id }, d.n + (d.custom ? ' 📖' : '')))),
        'Si la dote no está, créala primero en «Dotes».'),
      campo('Habilidades (elige 2)', chips('habilidades', hab, 2)),
      campo('Herramienta', texto('herramienta', 'p. ej. Herramientas de carpintero')),
      campo('Equipo (opción A), un objeto por línea', texto('equipo', 'Hoz\nHerramientas de carpintero\nEquipo de curandero', true), 'Para cantidades: 10×Antorcha. Las monedas van aparte.'),
      h('div.fila2', {}, campo('Oro de la opción A', h('input.num', { type: 'number', value: val.po || '', oninput: (e) => { val.po = e.target.value; } })),
        campo('Oro de la opción B', h('input.num', { type: 'number', value: val.poB || 50, oninput: (e) => { val.poB = e.target.value; } }))),
    );
  } else if (k === 'especies') {
    val.rasgos = val.rasgos?.length ? val.rasgos : [{ n: '', d: '' }];
    const rasgosZona = h('div');
    const pintarRasgos = () => rasgosZona.replaceChildren(...val.rasgos.map((r, i) => h('div.rasgo-form', {},
      h('input', { value: r.n, placeholder: 'Nombre del rasgo', oninput: (e) => { r.n = e.target.value; } }),
      h('textarea', { rows: 2, value: r.d, placeholder: 'Qué hace', oninput: (e) => { r.d = e.target.value; } }),
      h('button.x', { onclick: () => { val.rasgos.splice(i, 1); pintarRasgos(); } }, '× quitar'))),
    h('button.btn.peq', { onclick: () => { val.rasgos.push({ n: '', d: '' }); pintarRasgos(); } }, '+ Rasgo'));
    pintarRasgos();
    cuerpo.append(
      campo('Nombre', texto('n', 'p. ej. Aasimar')),
      campo('Descripción breve', texto('d', '', true)),
      campo('Tamaño', chips('tam', [['Mediano', 'Mediano'], ['Pequeño', 'Pequeño']], 2)),
      h('div.fila2', {},
        campo('Velocidad (m)', h('input.num', { type: 'number', step: 1.5, value: val.vel || 9, oninput: (e) => { val.vel = e.target.value; } })),
        campo('Visión en la oscuridad (m)', h('input.num', { type: 'number', step: 6, value: val.vision || 0, oninput: (e) => { val.vision = e.target.value; } }))),
      campo('PG extra por nivel', h('input.num', { type: 'number', value: val.pgExtra || 0, oninput: (e) => { val.pgExtra = e.target.value; } }), 'Solo si un rasgo lo da (como la dureza enana).'),
      h('label.radio', {}, h('input', { type: 'checkbox', checked: !!val.habilidadExtra, onchange: (e) => { val.habilidadExtra = e.target.checked; } }), ' Da competencia en una habilidad a elegir'),
      h('label.radio', {}, h('input', { type: 'checkbox', checked: !!val.doteOrigenExtra, onchange: (e) => { val.doteOrigenExtra = e.target.checked; } }), ' Da una dote de origen extra'),
      h('h4', {}, 'Rasgos'), rasgosZona,
    );
  } else {
    cuerpo.append(
      campo('Nombre', texto('n', 'p. ej. Afortunado')),
      campo('Tipo', h('select', { onchange: (e) => { val.tipo = e.target.value; } },
        [['origen', 'Dote de origen'], ['general', 'Dote general (nivel 4+)']].map(([v, t]) => h('option', { value: v, selected: (val.tipo || 'origen') === v }, t)))),
      campo('Requisito (opcional)', texto('req', 'p. ej. FUE 13+')),
      campo('Qué hace', texto('d', '', true)),
      campo('Competencias en habilidades que da', h('input.num', { type: 'number', min: 0, value: val.habilidades || 0, oninput: (e) => { val.habilidades = Number(e.target.value) || 0; } }), 'Para que el comprobador cuente bien las habilidades.'),
    );
  }

  while (true) {
    const ok = await modal(x.n ? `Editar ${x.n}` : 'Nuevo', cuerpo, [{ t: 'Cancelar', v: false }, { t: 'Guardar', v: true, clase: 'rojo' }]);
    if (!ok) return null;
    const falta = !val.n?.trim() ? 'Pon un nombre.'
      : k === 'trasfondos' && (val.carac || []).length !== 3 ? 'Elige exactamente 3 características.'
      : k === 'trasfondos' && !val.dote ? 'Elige la dote de origen.'
      : k === 'trasfondos' && (val.habilidades || []).length !== 2 ? 'Elige 2 habilidades.'
      : (k === 'trasfondos' ? TRASFONDOS : k === 'especies' ? ESPECIES : DOTES).some((y) => !y.custom && y.n.toLowerCase() === val.n.trim().toLowerCase()) ? 'Ya existe en el SRD con ese nombre.' : null;
    if (!falta) { val.n = val.n.trim(); if (k === 'especies') val.rasgos = val.rasgos.filter((r) => r.n.trim()); return val; }
    toast(falta, 3500);
  }
}
