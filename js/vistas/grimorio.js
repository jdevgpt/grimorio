// Componentes del grimorio: ficha de conjuro, filtros y selector
import { h, modal } from '../ui.js';
import { CONJUROS, ESCUELAS, NOMBRE_CLASE, LETRA_CLASE, norm, nivelTexto, resolucion } from '../datos/conjuros.js';

export function fichaConjuro(s, extra) {
  return h('div.ficha-conj', {},
    h('p.ficha-meta', {}, `${nivelTexto(s.nv)} · ${s.escuela}${s.ritual ? ' (ritual)' : ''}`),
    h('div.ficha-grid', {},
      h('span', {}, h('b', {}, 'Tiempo: '), s.t),
      h('span', {}, h('b', {}, 'Alcance: '), s.a),
      h('span', {}, h('b', {}, 'Componentes: '), s.c),
      h('span', {}, h('b', {}, 'Duración: '), s.conc ? `Concentración, ${s.du.toLowerCase()}` : s.du),
    ),
    (() => { const r = resolucion(s); return r.ataque ? h('p.resol.ataque', {}, `🎯 Requiere tirada de ataque de conjuro ${r.ataque} (d20 + tu bonificador de ataque).`)
      : r.salvacion ? h('p.resol.salvacion', {}, `🛡 El objetivo hace una salvación de ${r.salvacion} contra tu CD${r.mitad ? '; si la supera, suele recibir la mitad' : ''}.`) : null; })(),
    h('p', {}, s.d),
    s.s && h('p.peq', {}, h('b', {}, s.nv === 0 ? 'Mejora del truco: ' : 'A niveles superiores: '), s.s),
    h('p.peq.clases-conj', {}, [...s.cl].map((l) => NOMBRE_CLASE[l]).join(' · ')),
    extra,
  );
}

export const etiquetasConj = (s) => [s.conc && h('i.etq.conc', { title: 'Concentración' }, 'C'), s.ritual && h('i.etq', { title: 'Ritual' }, 'R')];

// Filtros reutilizables. estado: { q, nv, cl, esc, conc, ritual, maxNv }
export function filtrarConjuros(f) {
  const q = norm(f.q || '');
  return CONJUROS.filter((s) =>
    (f.nv === '' || f.nv == null || s.nv === Number(f.nv)) &&
    (f.maxNv == null || s.nv <= f.maxNv) &&
    (!f.cl || s.cl.includes(f.cl)) &&
    (!f.esc || s.e === f.esc) &&
    (!f.conc || s.conc) && (!f.ritual || s.ritual) &&
    (!q || norm(s.n).includes(q) || norm(s.d).includes(q)));
}

export function barraFiltros(f, alCambiar, { sinClase = false } = {}) {
  const sel = (k, opciones, placeholder) => h('select', { onchange: (e) => { f[k] = e.target.value; alCambiar(); } },
    h('option', { value: '' }, placeholder), opciones.map(([v, t]) => h('option', { value: v, selected: String(f[k] ?? '') === String(v) }, t)));
  const chk = (k, t) => h('button.chip' + (f[k] ? '.sel' : ''), { type: 'button', 'aria-pressed': f[k] ? 'true' : 'false', onclick: (e) => { f[k] = !f[k]; e.currentTarget.classList.toggle('sel', f[k]); e.currentTarget.setAttribute('aria-pressed', f[k]); e.currentTarget.firstChild.textContent = f[k] ? '✓ ' : ''; alCambiar(); } }, h('span', {}, f[k] ? '✓ ' : ''), t);
  return h('div.filtros', {},
    h('input.buscador', { type: 'search', placeholder: 'Buscar conjuro…', value: f.q || '', oninput: (e) => { f.q = e.target.value; alCambiar(true); } }),
    h('div.filtros-fila', {},
      sel('nv', Array.from({ length: 10 }, (_, i) => [i, nivelTexto(i)]), 'Todos los niveles'),
      !sinClase && sel('cl', Object.entries(NOMBRE_CLASE), 'Todas las clases'),
      sel('esc', Object.entries(ESCUELAS), 'Todas las escuelas'),
    ),
    h('div.chips', {}, chk('conc', 'Concentración'), chk('ritual', 'Ritual')),
  );
}

// Selector modal para añadir conjuros a la hoja
export function elegirConjuros({ claseId, maxNv, yaTiene }) {
  return new Promise((resolve) => {
    const f = { q: '', nv: '', cl: claseId ? LETRA_CLASE[claseId] : '', esc: '', maxNv: null, soloMiNivel: true };
    const elegidos = new Set();
    const lista = h('div.selector-lista');
    const pintarLista = () => {
      const r = filtrarConjuros({ ...f, maxNv: f.soloMiNivel ? maxNv : null }).slice(0, 150);
      lista.replaceChildren(...(r.length ? r.map((s) => {
        const tiene = yaTiene.has(s.id);
        return h('label.sel-conj' + (tiene ? '.tiene' : ''), {},
          h('input', { type: 'checkbox', disabled: tiene, checked: tiene || elegidos.has(s.id), onchange: (e) => { if (e.target.checked) elegidos.add(s.id); else elegidos.delete(s.id); contador.textContent = `${elegidos.size} seleccionado(s)`; } }),
          h('span', {}, h('b', {}, s.n), ' ', etiquetasConj(s), h('small', {}, ` ${nivelTexto(s.nv)} · ${s.escuela}`), h('small.sel-desc', {}, s.d)));
      }) : [h('p.ayuda', {}, 'Sin resultados.')]));
    };
    const contador = h('span.peq', {}, '0 seleccionado(s)');
    const cuerpo = h('div', {},
      barraFiltros(f, pintarLista),
      maxNv != null && h('label.radio', {}, h('input', { type: 'checkbox', checked: true, onchange: (e) => { f.soloMiNivel = e.target.checked; pintarLista(); } }), ` Solo hasta nivel ${maxNv} (lo que puedes lanzar)`),
      contador, lista);
    pintarLista();
    modal('Añadir del grimorio', cuerpo, [{ t: 'Cancelar', v: false }, { t: 'Añadir', v: true, clase: 'rojo' }])
      .then((ok) => resolve(ok ? CONJUROS.filter((s) => elegidos.has(s.id)) : []));
  });
}
