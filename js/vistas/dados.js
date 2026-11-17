import { h, mostrarTirada, estadoDados } from '../ui.js';

export function vistaDados(cont) {
  const expr = h('input.buscador', { placeholder: 'Expresión, p. ej. 2d6+3', onkeydown: (e) => { if (e.key === 'Enter') lanzar(); } });
  const lanzar = () => { if (expr.value.trim()) { mostrarTirada('Tirada', expr.value.trim()); pintar(); } };
  const historial = h('div.historial');
  const pintar = () => historial.replaceChildren(...estadoDados.historial.map((t) => h('div.hist', {},
    h('span', {}, t.etiqueta, h('small', {}, ` ${t.expr}`)), h('small', {}, t.detalle + (t.extra || '')), h('b', {}, t.total))));
  const d20 = (modo, txt) => h('button.btn', { onclick: () => { mostrarTirada(txt, modo === 'v' ? '2d20kh1' : modo === 'd' ? '2d20kl1' : '1d20'); pintar(); } }, txt);
  cont.replaceChildren(h('section.dados', {},
    h('h2', {}, 'Bandeja de dados'),
    h('div.dados-grid', {}, [4, 6, 8, 10, 12, 20, 100].map((d) => h('button.dado', { onclick: () => { mostrarTirada(`d${d}`, `1d${d}`); pintar(); } }, h('span', {}, 'd' + d)))),
    h('div.acciones', {}, d20('v', 'd20 con ventaja'), d20('d', 'd20 con desventaja')),
    h('div.form-linea', {}, expr, h('button.btn.rojo', { onclick: lanzar }, 'Tirar')),
    h('h3', {}, 'Historial'),
    historial,
  ));
  pintar();
}
