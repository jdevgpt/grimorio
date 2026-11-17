// Almanaque: estación del año con decoración y fecha real convertida al calendario de Harptos
import { h, modal } from './ui.js';
import { aHarptos, ESTACIONES, MESES } from './harptos.js';

const PARTICULAS = { invierno: ['❄', '❅', '❆'], primavera: ['❀', '✿', '❁'], verano: ['✦', '✧', '·'], otono: ['🍂', '🍁', '❦'] };

export function iniciarAlmanaque() {
  const pintar = () => {
    const hoy = new Date();
    const hp = aHarptos(hoy);
    const est = ESTACIONES[hp.estacion];
    document.body.classList.remove('est-invierno', 'est-primavera', 'est-verano', 'est-otono');
    document.body.classList.add(`est-${hp.estacion}`);

    // Partículas de temporada en la cabecera
    const cab = document.querySelector('.cab');
    cab.querySelector('.particulas')?.remove();
    const caja = h('div.particulas', { 'aria-hidden': 'true' });
    for (let i = 0; i < 9; i++) {
      caja.append(h('span', { style: { left: `${4 + i * 10 + Math.random() * 4}%`, animationDelay: `${-Math.random() * 12}s`, animationDuration: `${9 + Math.random() * 7}s`, fontSize: `${0.6 + Math.random() * 0.55}rem` } }, PARTICULAS[hp.estacion][i % 3]));
    }
    cab.append(caja);

    // Cinta con la fecha de Harptos
    document.querySelector('.almanaque')?.remove();
    const cinta = h('button.almanaque', { title: 'Calendario de Harptos', onclick: () => detalle(hoy, hp) },
      h('span.alm-icono', {}, est.icono),
      h('span.alm-texto', {}, h('b', {}, est.n), ' · ', hp.corto),
      hp.mes ? h('small.alm-apodo', {}, hp.mes.apodo) : h('small.alm-apodo', {}, '¡Día de festividad!'));
    cab.after(cinta);
  };
  pintar();
  // Si la app se queda abierta y cambia el día
  setInterval(() => { const ahora = new Date().toDateString(); if (ahora !== pintar.dia) { pintar.dia = ahora; pintar(); } }, 60000);
  pintar.dia = new Date().toDateString();
}

function detalle(hoy, hp) {
  const est = ESTACIONES[hp.estacion];
  modal(`${est.icono} ${hp.texto}`, h('div.alm-detalle', {},
    h('p', {}, h('b', {}, 'Hoy en el mundo real: '), hoy.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })),
    hp.mes ? [
      h('p', {}, h('b', {}, 'En Faerûn: '), `día ${hp.dia} de ${hp.mes.n}, «${hp.mes.apodo}», del año ${hp.año} del Cómputo de los Valles.`),
      h('p', {}, h('b', {}, 'Decenio: '), `${hp.decenio}.º del mes, día ${hp.diaDecenio} de 10.`),
    ] : h('p', {}, `Hoy se celebra ${hp.fiesta.es} (${hp.fiesta.n}), una festividad que no pertenece a ningún mes.`),
    h('p', {}, h('b', {}, 'Estación: '), est.n),
    h('p', {}, h('b', {}, 'Próxima festividad: '), `${hp.prox.fiesta.es} (${hp.prox.fiesta.n}), dentro de ${hp.prox.faltan} día${hp.prox.faltan === 1 ? '' : 's'}.`),
    h('details', {}, h('summary', {}, 'Los meses de Harptos'),
      h('ol.meses-harptos', {}, MESES.map((m) => h('li' + (hp.mes === m ? '.actual' : ''), {}, h('b', {}, m.n), ` — ${m.apodo}`)))),
    h('p.peq', {}, 'El calendario de Harptos tiene 12 meses de 30 días, divididos en tres decenios, más cinco festividades entre meses (y el Encuentro de Escudos cada cuatro años).'),
  ));
}
