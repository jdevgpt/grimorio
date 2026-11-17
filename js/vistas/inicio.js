import { h, toast } from '../ui.js';
import { clase } from '../datos/clases.js';
import { especie } from '../datos/especies.js';
import { calcular, validar } from '../motor.js';
import { misPersonajes, guardar, estado } from '../almacen.js';

export function vistaInicio(cont, irA) {
  const lista = misPersonajes();
  const importar = h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const pj = JSON.parse(await f.text());
      if (!pj.id || !pj.base) throw new Error();
      pj.id = 'pj_' + Date.now().toString(36); pj.partida = null; pj.owner = null;
      await guardar(pj, true); toast(`Importado: ${pj.nombre}`); irA(`#/pj/${pj.id}`);
    } catch { toast('El archivo no es una hoja válida de La Senda del Errante.'); }
  } });
  cont.replaceChildren(
    h('section.inicio', {},
      h('div.bienvenida', {},
        h('h2', {}, 'Tus personajes'),
        h('p.ayuda', {}, estado.usuario ? `Guardados en tu cuenta (${estado.usuario.nombre}).` : 'Guardados en este dispositivo. Entra en Partidas para sincronizarlos y compartirlos con tu DM.'),
      ),
      h('div.acciones', {},
        h('button.btn.rojo', { onclick: () => irA('#/crear') }, '✦ Nuevo personaje'),
        h('button.btn', { onclick: () => importar.click() }, '⬆ Importar JSON'), importar,
      ),
      lista.length ? h('div.lista-pj', {}, lista.map(tarjetaPJ(irA))) : h('div.vacio', {},
        h('p', {}, 'Aún no hay ningún errante en el camino.'),
        h('p.peq', {}, 'Crea uno nuevo o introduce la hoja que ya tienes en papel.')),
    ),
  );
}

export const tarjetaPJ = (irA, mostrarJugador = false) => (pj) => {
  let c = null; try { c = calcular(pj); } catch { /* hoja incompleta */ }
  const errores = validar(pj).filter((x) => x.tipo === 'error').length;
  const pg = pj.pg?.actual ?? c?.pgMax;
  return h('button.tarjeta-pj', { onclick: () => irA(`#/pj/${pj.id}`) },
    h('div.sello', {}, (pj.nombre || '?')[0].toUpperCase()),
    h('div.tpj-info', {},
      h('strong', {}, pj.nombre || 'Sin nombre'),
      h('span', {}, `${especie(pj.especie)?.n || '—'} · ${clase(pj.clase)?.n || '—'} ${pj.nivel}`),
      mostrarJugador && h('span.peq', {}, pj.ownerNombre || pj.jugador || ''),
      pj.partidaNombre && !mostrarJugador && h('span.peq', {}, `⚑ ${pj.partidaNombre}`),
    ),
    c && h('div.tpj-stats', {},
      h('span', {}, h('small', {}, 'PG'), h('b', {}, `${pg}/${c.pgMax}`)),
      h('span', {}, h('small', {}, 'CA'), h('b', {}, c.ca)),
    ),
    h('span.tpj-val' + (errores ? '.mal' : '.bien'), { title: errores ? `${errores} problema(s) con las reglas` : 'Cumple las reglas' }, errores ? '✗' : '✓'),
  );
};
