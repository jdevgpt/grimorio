import { h } from '../ui.js';

export function informeValidacion(lista) {
  const errores = lista.filter((x) => x.tipo === 'error');
  const avisos = lista.filter((x) => x.tipo === 'aviso');
  const oks = lista.filter((x) => x.tipo === 'ok');
  return h('div.informe', {},
    h('p.veredicto' + (errores.length ? '.mal' : '.bien'), {}, errores.length ? `✗ ${errores.length} problema(s) con las reglas` : '✓ Cumple las reglas', avisos.length ? ` · ${avisos.length} aviso(s)` : ''),
    h('ul', {},
      errores.map((x) => h('li.error', {}, x.t)),
      avisos.map((x) => h('li.aviso', {}, x.t)),
      oks.map((x) => h('li.ok', {}, x.t)),
    ),
  );
}

export const metros = (v) => `${String(v).replace('.', ',')} m`;
