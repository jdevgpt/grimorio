// Tracker de iniciativa de la partida, en tiempo real
import { h, toast, confirmar, alSalir, estadoDados, pedirTexto } from '../ui.js';
import { tirar, calcular } from '../motor.js';
import { fmt } from '../datos/reglas.js';
import { conDefecto } from '../datos/opciones.js';
import { estado, escucharSub, escucharDoc, crearEnSub, escribirEnSub, borrarEnSub, actualizarPartida, nombreDe, soyDMDe, gestionaIniciativa, personajesDePartida, misPersonajes } from '../almacen.js';

const ordenar = (ps) => [...ps].sort((a, b) => (b.ini ?? -99) - (a.ini ?? -99) || (b.bon || 0) - (a.bon || 0) || a.n.localeCompare(b.n, 'es'));

export function vistaIniciativa(cont, p) {
  const uid = estado.usuario.uid;
  const dm = soyDMDe(p);
  const gestor = gestionaIniciativa(p);
  let participantes = []; let combate = { activo: false, ronda: 0, turno: null };
  let ultimoTurno = null;

  const zona = h('div.ini-zona');
  const pintar = () => {
    const orden = ordenar(participantes).filter((x) => gestor || !x.oculto);
    const pendientes = participantes.filter((x) => x.ini == null);
    zona.replaceChildren(...[
      h('div.ini-cab', {},
        combate.activo ? h('div.ronda', {}, h('small', {}, 'Ronda'), h('b', {}, combate.ronda)) : h('p.ayuda', {}, participantes.length ? 'Combate preparado. Pulsa «Empezar» cuando estéis listos.' : 'No hay ningún combate en marcha.'),
        gestor && h('div.acciones', {},
          !combate.activo && participantes.length ? h('button.btn.rojo', { onclick: empezar }, '⚔ Empezar combate') : null,
          combate.activo && h('button.btn', { onclick: () => avanzar(-1) }, '◀ Anterior'),
          combate.activo && h('button.btn.rojo', { onclick: () => avanzar(1) }, 'Siguiente turno ▶'),
          participantes.length ? h('button.btn', { onclick: terminar }, '■ Terminar y limpiar') : null,
        ),
      ),
      pendientes.length && gestor ? h('div.aviso-caja', {}, h('span', {}, `${pendientes.length} sin iniciativa. `),
        h('button.btn.peq', { onclick: tirarPendientes }, '🎲 Tirar las que faltan')) : null,
      h('ol.ini-lista', {}, orden.map((x) => filaParticipante(x))),
      !orden.length ? h('p.peq', {}, 'Añade personajes y enemigos para empezar.') : null,
      miPersonajeUI(),
      gestor ? formAnadir() : null,
      dm ? permisosUI() : null,
    ].filter((x) => x != null && x !== false));
  };

  function filaParticipante(x) {
    const turno = combate.activo && combate.turno === x.id;
    const puedeEditar = gestor || (p.iniPropia && x.uid === uid);
    return h('li.ini-fila' + (turno ? '.turno' : '') + (x.tipo === 'enemigo' ? '.enemigo' : '.aliado') + (x.pg === 0 ? '.caido' : ''), {},
      h('div.ini-valor', {}, puedeEditar
        ? h('input.num', { type: 'number', value: x.ini ?? '', placeholder: '—', onchange: (e) => escribirEnSub(p.id, 'iniciativa', x.id, { ini: e.target.value === '' ? null : Number(e.target.value) }) })
        : h('b', {}, x.ini ?? '—')),
      h('div.ini-info', {},
        h('b', {}, (turno ? '▶ ' : '') + x.n, x.oculto ? h('small', {}, ' (oculto)') : ''),
        h('small', {}, [x.tipo === 'enemigo' ? 'Enemigo' : x.uid ? nombreDe(p, x.uid) : 'Aliado', x.bon != null ? `Inic. ${fmt(x.bon)}` : null, x.ca ? `CA ${x.ca}` : null].filter(Boolean).join(' · ')),
        x.notas ? h('small.notas', {}, x.notas) : null,
      ),
      x.pgMax && (gestor || x.tipo !== 'enemigo') ? h('div.ini-pg', {},
        gestor && h('button', { onclick: () => cambiarPG(x, -1) }, '−'),
        h('span', {}, `${x.pg}/${x.pgMax}`),
        gestor && h('button', { onclick: () => cambiarPG(x, 1) }, '+')) : null,
      h('div.ini-botones', {},
        puedeEditar && x.ini == null ? h('button.btn.peq', { onclick: () => tirarUno(x) }, '🎲') : null,
        gestor && x.tipo === 'enemigo' ? h('button.btn.peq', { title: 'Ocultar a los jugadores', onclick: () => escribirEnSub(p.id, 'iniciativa', x.id, { oculto: !x.oculto }) }, x.oculto ? '👁' : '◌') : null,
        (gestor || x.uid === uid) && h('button.x', { onclick: () => quitar(x) }, '×'),
      ),
    );
  }

  async function cambiarPG(x, signo) {
    const v = await pedirTexto(signo < 0 ? `Daño a ${x.n}` : `Curación a ${x.n}`, 'Cantidad');
    const n = Number(v); if (!n) return;
    await escribirEnSub(p.id, 'iniciativa', x.id, { pg: Math.max(0, Math.min(x.pgMax, x.pg + signo * n)) });
  }

  const tiradaIni = (bon) => tirar(estadoDados.modo === 'ventaja' ? `2d20kh1${fmt(bon || 0)}` : estadoDados.modo === 'desventaja' ? `2d20kl1${fmt(bon || 0)}` : `1d20${fmt(bon || 0)}`).total;
  async function tirarUno(x) { const v = tiradaIni(x.bon); await escribirEnSub(p.id, 'iniciativa', x.id, { ini: v }); toast(`${x.n}: ${v}`); }
  async function tirarPendientes() { for (const x of participantes.filter((y) => y.ini == null)) await escribirEnSub(p.id, 'iniciativa', x.id, { ini: tiradaIni(x.bon) }); }

  async function quitar(x) {
    if (combate.turno === x.id) await avanzar(1);
    await borrarEnSub(p.id, 'iniciativa', x.id);
  }

  async function empezar() {
    if (participantes.some((x) => x.ini == null)) await tirarPendientes();
    const primero = ordenar(participantes)[0];
    await escribirEnSub(p.id, 'combate', 'estado', { activo: true, ronda: 1, turno: primero.id, inicio: Date.now() }, false);
  }

  async function avanzar(paso) {
    const orden = ordenar(participantes).filter((x) => x.pg !== 0 || x.tipo !== 'enemigo');
    if (!orden.length) return;
    let i = orden.findIndex((x) => x.id === combate.turno);
    let ronda = combate.ronda;
    i += paso;
    if (i >= orden.length) { i = 0; ronda++; }
    if (i < 0) { i = orden.length - 1; ronda = Math.max(1, ronda - 1); }
    await escribirEnSub(p.id, 'combate', 'estado', { activo: true, ronda, turno: orden[i].id });
  }

  async function terminar() {
    if (!(await confirmar('Terminar combate', 'Se borran todos los participantes y la ronda vuelve a 0, listo para un combate nuevo.', 'Terminar'))) return;
    for (const x of participantes) await borrarEnSub(p.id, 'iniciativa', x.id);
    await escribirEnSub(p.id, 'combate', 'estado', { activo: false, ronda: 0, turno: null }, false);
    toast('Combate terminado.');
  }

  // Un jugador apunta a su propio personaje
  function miPersonajeUI() {
    if (!p.iniPropia && !gestor) return null;
    const mios = misPersonajes().filter((x) => x.partida === p.id && !participantes.some((y) => y.pjId === x.id));
    if (!mios.length) return null;
    return h('div.ini-mios', {}, h('h4', {}, 'Tu personaje'), mios.map((pj) => {
      const c = calcular(pj, conDefecto(p.reglas));
      return h('button.btn', { onclick: async () => {
        const v = tiradaIni(c.iniciativa);
        await crearEnSub(p.id, 'iniciativa', { n: pj.nombre, uid, pjId: pj.id, bon: c.iniciativa, ini: v, tipo: 'pj', ca: c.ca, pg: pj.pg?.actual ?? c.pgMax, pgMax: c.pgMax, creada: Date.now() });
        toast(`${pj.nombre}: iniciativa ${v}`);
      } }, `🎲 Tirar iniciativa de ${pj.nombre} (${fmt(c.iniciativa)})`);
    }));
  }

  function formAnadir() {
    const n = h('input', { placeholder: 'Nombre (p. ej. Goblin)' });
    const bon = h('input.num', { type: 'number', placeholder: '+0', title: 'Bonificador de iniciativa' });
    const ini = h('input.num', { type: 'number', placeholder: 'Ini.', title: 'Iniciativa (vacío = tirar)' });
    const cant = h('input.num', { type: 'number', value: 1, min: 1, title: 'Cantidad' });
    const pg = h('input.num', { type: 'number', placeholder: 'PG', title: 'Puntos de golpe' });
    const ca = h('input.num', { type: 'number', placeholder: 'CA', title: 'Clase de armadura' });
    const tipo = h('select', {}, h('option', { value: 'enemigo' }, 'Enemigo'), h('option', { value: 'aliado' }, 'Aliado / PNJ'));
    const oculto = h('label.radio', {}, h('input', { type: 'checkbox' }), ' Oculto');
    const pjsMesa = dm ? personajesDePartida(p.id).filter((x) => !participantes.some((y) => y.pjId === x.id)) : [];
    return h('div.ini-form', {},
      h('h4', {}, 'Añadir al combate'),
      pjsMesa.length ? h('button.btn', { onclick: async () => {
        for (const pj of pjsMesa) {
          const c = calcular(pj, conDefecto(p.reglas));
          await crearEnSub(p.id, 'iniciativa', { n: pj.nombre, uid: pj.owner, pjId: pj.id, bon: c.iniciativa, ini: null, tipo: 'pj', ca: c.ca, pg: pj.pg?.actual ?? c.pgMax, pgMax: c.pgMax, creada: Date.now() });
        }
        toast(`${pjsMesa.length} personaje(s) añadidos. Pueden tirar ellos o pulsa «Tirar las que faltan».`);
      } }, `⚑ Añadir los personajes de la mesa (${pjsMesa.length})`) : null,
      h('div.ini-form-grid', {}, n, tipo, h('label', {}, h('small', {}, 'Bon.'), bon), h('label', {}, h('small', {}, 'Ini.'), ini), h('label', {}, h('small', {}, 'Cant.'), cant), h('label', {}, h('small', {}, 'PG'), pg), h('label', {}, h('small', {}, 'CA'), ca)),
      oculto,
      h('button.btn.rojo', { onclick: async () => {
        const nombre = n.value.trim(); if (!nombre) return toast('Pon un nombre.');
        const k = Math.max(1, Math.min(20, Number(cant.value) || 1));
        for (let i = 1; i <= k; i++) {
          const b = Number(bon.value) || 0;
          await crearEnSub(p.id, 'iniciativa', {
            n: k > 1 ? `${nombre} ${i}` : nombre, tipo: tipo.value, bon: b,
            ini: ini.value !== '' ? Number(ini.value) : tiradaIni(b),
            pg: pg.value ? Number(pg.value) : null, pgMax: pg.value ? Number(pg.value) : null, ca: ca.value ? Number(ca.value) : null,
            oculto: oculto.querySelector('input').checked, creada: Date.now(),
          });
        }
        n.value = ''; ini.value = '';
      } }, '+ Añadir'),
    );
  }

  function permisosUI() {
    return h('details.panel-reglas', {}, h('summary', {}, h('h3', {}, 'Quién lleva la iniciativa'), h('small', {}, 'Tú siempre. Marca a los jugadores que también pueden gestionarla.')),
      h('div.chips', {}, p.miembros.filter((m) => m !== p.dm).map((m) => {
        const on = (p.gestoresIni || []).includes(m);
        return h('button.chip' + (on ? '.sel' : ''), { onclick: () => actualizarPartida(p.id, { gestoresIni: on ? (p.gestoresIni || []).filter((x) => x !== m) : [...(p.gestoresIni || []), m] }) }, nombreDe(p, m));
      })),
      h('label.regla.interruptor', {}, h('input', { type: 'checkbox', checked: p.iniPropia !== false, onchange: (e) => actualizarPartida(p.id, { iniPropia: e.target.checked }) }),
        h('span', {}, h('b', {}, 'Cada jugador tira la iniciativa de su personaje'), h('small', {}, 'Si lo desactivas, solo tú y los gestores podéis apuntarla.'))));
  }

  cont.replaceChildren(h('section.iniciativa', {}, zona));
  pintar();
  const f1 = escucharSub(p.id, 'iniciativa', (docs, error) => {
    if (error) { zona.replaceChildren(h('p.ayuda.mal', {}, 'No se puede leer la iniciativa. ¿Has publicado las reglas nuevas de Firestore?')); return; }
    participantes = docs || [];
    if (!zona.contains(document.activeElement) || document.activeElement.tagName !== 'INPUT') pintar();
  });
  const f2 = escucharDoc(p.id, 'combate', 'estado', (d) => {
    combate = d || { activo: false, ronda: 0, turno: null };
    const actual = participantes.find((x) => x.id === combate.turno);
    if (combate.activo && combate.turno !== ultimoTurno && actual?.uid === uid) { toast(`⚔ ¡Es tu turno, ${actual.n}!`, 4000); if (navigator.vibrate) try { navigator.vibrate([80, 60, 80]); } catch { /* */ } }
    ultimoTurno = combate.turno;
    pintar();
  });
  alSalir(() => { f1(); f2(); });
}
