// Botón 🎲 que abre el generador de nombres y rellena un campo de texto
import { h, modal } from '../ui.js';
import { ESTILOS, MONSTRUOS, listaNombres } from '../datos/nombres.js';

export function botonNombres(input, { estilo = () => 'humano', criaturas = false, alElegir } = {}) {
  return h('button.btn.dado-nombre', { type: 'button', title: 'Generar nombre aleatorio', onclick: () => abrir() }, '🎲');

  async function abrir() {
    const est = { estilo: estilo() || 'humano', genero: 'cualquiera' };
    const lista = h('div.nombres-lista');
    const pintar = () => lista.replaceChildren(...listaNombres(est.estilo, est.genero, 8).map((n) =>
      h('button.chip.nombre', { type: 'button', onclick: () => { input.value = n; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); alElegir?.(n); document.querySelector('.modal-fondo')?.click(); } }, n)));
    const opciones = [
      h('optgroup', { label: 'Pueblos' }, Object.entries(ESTILOS).map(([id, e]) => h('option', { value: id, selected: est.estilo === id }, e.n))),
      criaturas ? h('optgroup', { label: 'Criaturas y enemigos' }, Object.entries(MONSTRUOS).map(([id, m]) => h('option', { value: id, selected: est.estilo === id }, m.n))) : null,
    ];
    const cuerpo = h('div', {},
      h('div.fila2', {},
        h('label.campo', {}, h('span', {}, 'Estilo'), h('select', { onchange: (e) => { est.estilo = e.target.value; pintar(); } }, opciones)),
        h('label.campo', {}, h('span', {}, 'Género'), h('select', { onchange: (e) => { est.genero = e.target.value; pintar(); } },
          [['cualquiera', 'Cualquiera'], ['m', 'Masculino'], ['f', 'Femenino']].map(([v, t]) => h('option', { value: v }, t))))),
      h('p.peq', {}, 'Toca un nombre para usarlo.'),
      lista,
      h('button.btn', { type: 'button', onclick: pintar }, '🎲 Otros nombres'),
    );
    pintar();
    await modal('Generador de nombres', cuerpo, [{ t: 'Cerrar' }]);
  }
}
