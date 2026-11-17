import { h, toast, confirmar, pedirTexto } from '../ui.js';
import { estado, entrar, salir, crearPartida, unirsePartida, borrarPartida, expulsar, personajesDePartida, misPersonajes, asignarPartida, hayLocales, subirLocales } from '../almacen.js';
import { tarjetaPJ } from './inicio.js';
import { calcular } from '../motor.js';
import { ESTADOS } from '../datos/reglas.js';

export function vistaPartidas(cont, irA, partidaId) {
  if (!estado.nube) {
    cont.replaceChildren(h('section', {},
      h('h2', {}, 'Partidas compartidas'),
      h('p', {}, 'Para compartir hojas con tu grupo hay que conectar la app con Firebase (gratis). Mientras tanto, todo se guarda solo en este dispositivo.'),
      h('p.peq', {}, 'Instrucciones en el archivo FIREBASE.md del repositorio.'),
    ));
    return;
  }
  if (!estado.listo) { cont.replaceChildren(h('p.ayuda', {}, 'Conectando…')); return; }
  if (!estado.usuario) {
    cont.replaceChildren(h('section.centrado', {},
      h('h2', {}, 'Partidas compartidas'),
      h('p', {}, 'Entra con tu cuenta de Google. Cada jugador edita solo su hoja; el DM ve las de todos en tiempo real.'),
      h('button.btn.rojo.grande', { onclick: () => entrar().catch((e) => toast('No se pudo entrar: ' + e.message)) }, 'Entrar con Google'),
    ));
    return;
  }
  if (partidaId) return vistaMesa(cont, irA, partidaId);

  const locales = hayLocales();
  cont.replaceChildren(h('section', {},
    h('div.usuario', {}, estado.usuario.foto && h('img', { src: estado.usuario.foto, alt: '', referrerpolicy: 'no-referrer' }), h('span', {}, estado.usuario.nombre), h('button.btn.peq', { onclick: () => salir() }, 'Salir')),
    locales ? h('div.aviso-caja', {}, h('p', {}, `Tienes ${locales} personaje(s) guardados solo en este dispositivo.`),
      h('button.btn.peq.rojo', { onclick: async () => { const n = await subirLocales(); toast(`${n} personaje(s) subidos a tu cuenta.`); } }, 'Subirlos a mi cuenta')) : null,
    h('h2', {}, 'Mis partidas'),
    estado.partidas.length ? h('div.lista-partidas', {}, estado.partidas.map((p) => h('button.tarjeta-partida', { onclick: () => irA(`#/partidas/${p.id}`) },
      h('strong', {}, p.nombre), h('span', {}, p.dm === estado.usuario.uid ? '★ Eres el DM' : `DM: ${p.dmNombre}`), h('small', {}, `${p.miembros.length} miembro(s)`)))) : h('p.peq', {}, 'Aún no estás en ninguna partida.'),
    h('div.acciones', {},
      h('button.btn.rojo', { onclick: async () => { const n = await pedirTexto('Nueva partida', 'Nombre de la campaña'); if (n) { const id = await crearPartida(n); irA(`#/partidas/${id}`); } } }, '✦ Crear partida (DM)'),
      h('button.btn', { onclick: async () => { const cod = await pedirTexto('Unirse a una partida', 'Código que te ha dado el DM'); if (!cod) return; try { const p = await unirsePartida(cod); toast(`Te has unido a ${p.nombre}`); irA(`#/partidas/${p.id}`); } catch (e) { toast(e.message); } } }, '⚑ Unirme con código'),
    ),
  ));
}

function vistaMesa(cont, irA, pid) {
  const p = estado.partidas.find((x) => x.id === pid);
  if (!p) { cont.replaceChildren(h('p.ayuda', {}, 'Cargando partida… (o no perteneces a ella)')); return; }
  const soyDM = p.dm === estado.usuario.uid;
  const pjs = personajesDePartida(pid);
  const mios = misPersonajes();
  const libres = mios.filter((x) => x.partida !== pid);
  cont.replaceChildren(h('section.mesa', {},
    h('button.btn.peq', { onclick: () => irA('#/partidas') }, '← Partidas'),
    h('h2', {}, p.nombre),
    h('p', {}, soyDM ? 'Eres el DM de esta partida.' : `DM: ${p.dmNombre}`),
    soyDM && h('div.codigo', {}, h('small', {}, 'Código para invitar'), h('b', {}, p.codigo),
      h('button.btn.peq', { onclick: () => { navigator.clipboard?.writeText(p.codigo); toast('Código copiado'); } }, 'Copiar')),
    h('h3', {}, soyDM ? 'Personajes de la mesa' : 'Tus personajes en esta partida'),
    pjs.length ? h('div.lista-pj', {}, pjs.map(tarjetaPJ(irA, soyDM))) : h('p.peq', {}, soyDM ? 'Ningún jugador ha unido aún su personaje.' : 'Aún no has unido ningún personaje.'),
    soyDM && pjs.length ? resumenMesa(pjs) : null,
    libres.length ? h('div', {}, h('h3', {}, 'Unir uno de mis personajes'),
      h('div.chips', {}, libres.map((x) => h('button.chip', { onclick: async () => { await asignarPartida(x, p); toast(`${x.nombre} se une a ${p.nombre}`); } }, x.nombre || 'Sin nombre')))) : null,
    soyDM && h('div.acciones', {}, h('button.btn.rojo', { onclick: async () => { if (await confirmar('Borrar partida', 'Las hojas no se borran: siguen siendo de sus jugadores.', 'Borrar')) { await borrarPartida(p.id); irA('#/partidas'); } } }, '🗑 Borrar partida')),
    !soyDM && h('div.acciones', {}, h('button.btn', { onclick: async () => { if (await confirmar('Salir de la partida', '¿Quieres dejar esta partida?', 'Salir')) { for (const x of pjs) await asignarPartida(x, null); await expulsar(p, estado.usuario.uid); irA('#/partidas'); } } }, 'Salir de la partida')),
  ));
}

function resumenMesa(pjs) {
  return h('div', {}, h('h3', {}, 'Vista rápida del DM'),
    h('table.tabla-mesa', {},
      h('tr', {}, ['Personaje', 'PG', 'CA', 'Perc.', 'Estados'].map((t) => h('th', {}, t))),
      pjs.map((pj) => { const c = calcular(pj); return h('tr', {},
        h('td', {}, pj.nombre),
        h('td', {}, `${pj.pg?.actual ?? c.pgMax}/${c.pgMax}${pj.pg?.temp ? ` +${pj.pg.temp}` : ''}`),
        h('td', {}, c.ca), h('td', {}, c.percepcionPasiva),
        h('td.peq', {}, [...(pj.estados || []).map((id) => ESTADOS.find((e) => e.id === id)?.n), pj.agotamiento ? `Agot. ${pj.agotamiento}` : null].filter(Boolean).join(', ') || '—'));
      }),
    ));
}
