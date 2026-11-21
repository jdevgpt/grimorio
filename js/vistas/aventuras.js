// Aventuras del DM: guion por escenas, secretos, personajes, pistas, combates, reloj y mapas.
import { h, toast, modal, confirmar, descargar, alSalir } from '../ui.js';
import { estado, crearEnSub, escucharSub, gestionaIniciativa, puedeEscribirCronica, soyDMDe, fbListo } from '../almacen.js';
import {
  listarAventuras, obtenerAventura, guardarAventura, borrarAventura, normalizarAventura,
  leerProgreso, guardarProgreso, reiniciarProgreso, aventuraDePartida, vincularAventura, hayAventurasLocales, subirAventurasLocales, ultimoErrorCarga,
} from '../datos/aventuras.js';

const nombreArchivoAv = (t) => `LSDE_Aventura_${String(t || 'Aventura').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '')}.json`;

function botonImportar(alTerminar) {
  const inp = h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const av = normalizarAventura(JSON.parse(await f.text()));
      const ya = await obtenerAventura(av.id);
      if (ya && !(await confirmar('Reemplazar aventura', `Ya tienes «${ya.titulo}». ¿Quieres reemplazarla por la del archivo? Tu progreso (escena, pistas, reloj) se conserva.`, 'Reemplazar'))) return;
      try { await guardarAventura(av); toast(fbListo() ? `Aventura guardada en tu cuenta: ${av.titulo}` : `Aventura importada en este dispositivo: ${av.titulo}`); }
      catch (err) { if (!err.guardadaLocal) throw err; toast(err.message, 6000); }
      alTerminar(av);
    } catch (err) { toast(err.message || 'No se pudo leer el archivo.'); }
    inp.value = '';
  } });
  return [h('button.btn', { onclick: () => inp.click() }, '⬆ Importar aventura'), inp];
}

// ---------- Lista de aventuras ----------
export async function vistaAventuras(cont, irA, id) {
  if (id) {
    const av = await obtenerAventura(id);
    if (!av) { const e = ultimoErrorCarga(); cont.replaceChildren(h('button.btn.peq', { onclick: () => irA('#/aventuras') }, '← Aventuras'), h('p.ayuda', {}, !estado.listo ? 'Cargando…' : e ? `No se pudo abrir la aventura desde tu cuenta (${e.code || e.message}). Revisa la conexión y que las reglas de Firestore estén publicadas.` : 'No se encuentra esta aventura (ni en tu cuenta ni en este dispositivo).')); return; }
    const caja = h('section.aventura');
    cont.replaceChildren(h('button.btn.peq', { onclick: () => irA('#/aventuras') }, '← Aventuras'), caja);
    return lectorAventura(caja, av, { irA });
  }
  const lista = await listarAventuras();
  const nLocales = await hayAventurasLocales();
  cont.replaceChildren(h('section.aventuras', {},
    h('h2', {}, 'Mis aventuras'),
    h('p.ayuda', {}, 'Guiones para dirigir: escenas con el texto para leer en voz alta, secretos del DM, personajes, pistas, combates y mapas. Solo los ves tú.'),
    fbListo() ? h('p.peq', {}, `☁ Se guardan en tu cuenta (${estado.usuario.nombre}) y las verás en todos tus dispositivos.`)
      : h('p.peq', {}, '📱 Ahora se guardan solo en este dispositivo. Entra con Google en Partidas para guardarlas en tu cuenta.'),
    nLocales && fbListo() ? h('div.aviso-caja', {}, h('p', {}, `Tienes ${nLocales} aventura(s) guardadas solo en este dispositivo.`),
      h('button.btn.peq.rojo', { onclick: async () => { try { const n = await subirAventurasLocales(); toast(`${n} aventura(s) subidas a tu cuenta.`); } catch (e) { toast(e.message, 6000); } vistaAventuras(cont, irA); } }, 'Subirlas a mi cuenta')) : null,
    lista.length ? h('div.lista-av', {}, lista.map((av) => h('button.tarjeta-av', { onclick: () => irA(`#/aventuras/${av.id}`) },
      h('strong', {}, av.titulo),
      av.subtitulo ? h('span', {}, av.subtitulo) : null,
      h('small', {}, [av.nube ? '☁ En tu cuenta' : '📱 Este dispositivo', av.nivel && `Nivel ${av.nivel}`, av.jugadores && `${av.jugadores} jugadores`, av.duracion, `${av.escenas.length} escenas`].filter(Boolean).join(' · '))))) : h('div.vacio', {},
      h('p', {}, 'Aún no tienes ninguna aventura.'),
      h('p.peq', {}, 'Importa el archivo .json de una aventura. Si la vas a dirigir en una partida, también puedes hacerlo desde la pestaña «Aventura» de la partida.')),
    h('div.acciones-principales', {}, ...botonImportar((av) => irA(`#/aventuras/${av.id}`))),
  ));
}

// ---------- Pestaña «Aventura» dentro de una partida (solo DM) ----------
export async function vistaAventuraPartida(cont, irA, p) {
  if (!soyDMDe(p)) { cont.replaceChildren(h('p.ayuda', {}, 'Solo el DM ve la aventura.')); return; }
  const aid = aventuraDePartida(p);
  const av = aid ? await obtenerAventura(aid) : null;
  if (av) {
    const caja = h('section.aventura');
    cont.replaceChildren(caja);
    return lectorAventura(caja, av, { irA, partida: p, alDesvincular: async () => { await vincularAventura(p, null); vistaAventuraPartida(cont, irA, p); } });
  }
  const lista = await listarAventuras();
  cont.replaceChildren(h('div', {},
    h('p.ayuda', {}, 'Elige la aventura que vas a dirigir en esta partida. Solo la ves tú.'),
    lista.length ? h('div.lista-av', {}, lista.map((x) => h('button.tarjeta-av', { onclick: async () => { await vincularAventura(p, x.id); vistaAventuraPartida(cont, irA, p); } },
      h('strong', {}, x.titulo), x.subtitulo ? h('span', {}, x.subtitulo) : null, h('small', {}, x.nube ? '☁ En tu cuenta' : '📱 Este dispositivo')))) : h('p.peq', {}, 'Aún no tienes aventuras. Importa una:'),
    h('div.acciones-principales', {}, ...botonImportar(async (x) => { await vincularAventura(p, x.id); vistaAventuraPartida(cont, irA, p); })),
  ));
}

// ---------- Lector ----------
const PESTANAS = [
  ['escenas', '📜 Escenas', (av) => av.escenas.length],
  ['secretos', '🔒 Secretos', (av) => av.secretos.length],
  ['pnj', '☺ Personajes', (av) => av.pnj.length],
  ['pistas', '🔎 Pistas', (av) => av.pistas.length],
  ['combates', '⚔ Combates', (av) => av.combates.length],
  ['reloj', '⏳ Reloj', (av) => !!av.reloj],
  ['mapas', '🗺 Mapas', (av) => av.mapas.length],
];

function lectorAventura(caja, av, ctx) {
  const prog = leerProgreso(av);
  const p = ctx.partida || null;
  const guardar = () => guardarProgreso(av, prog);
  const cuerpo = h('div.av-cuerpo');
  const pest = h('nav.pestanas.av-pest');
  const relojMini = h('div.av-reloj-mini');

  const ir = (tab, extra = {}) => { Object.assign(prog, { tab }, extra); guardar(); pintar(); };
  const escena = (id) => av.escenas.find((e) => e.id === id || e.codigo === id);
  const secreto = (cod) => av.secretos.find((s) => s.codigo === cod || s.id === cod);
  const pista = (cod) => av.pistas.find((x) => x.codigo === cod || x.id === cod);
  const pnj = (n) => { const q = String(n).toLowerCase().trim(); return av.pnj.find((x) => x.id === n) || av.pnj.find((x) => x.n?.toLowerCase() === q) || av.pnj.find((x) => x.n?.toLowerCase().includes(q)); };
  const combate = (id) => av.combates.find((c) => c.id === id || c.codigo === id);
  const mapa = (id) => av.mapas.find((m) => m.id === id);
  const enemigo = (id) => av.enemigos.find((e) => e.id === id || e.n === id);

  // [[E3]] escena · [[DM-4]] secreto · [[P7]] pista · [[PNJ:Bastián]] · [[C:refugio]] combate · [[M:aldea]] mapa
  function enlace(ref) {
    const r = ref.trim();
    let m;
    if ((m = r.match(/^(?:PNJ|Ficha):\s*(.+)$/i))) { const x = pnj(m[1]); return x ? h('button.av-link.pnj', { onclick: () => fichaPNJ(x) }, x.n) : `[${r}]`; }
    if ((m = r.match(/^C:\s*(.+)$/i))) { const c = combate(m[1]); return c ? h('button.av-link.comb', { onclick: () => ir('combates', { combate: c.id }) }, `⚔ ${c.n}`) : `[${r}]`; }
    if ((m = r.match(/^M:\s*(.+)$/i))) { const mp = mapa(m[1]); return mp ? h('button.av-link.mapa', { onclick: () => verMapa(mp) }, `🗺 ${mp.n}`) : `[${r}]`; }
    const e = escena(r); if (e) return h('button.av-link.esc', { onclick: () => ir('escenas', { escena: e.id }) }, `${e.codigo || e.id}${e.titulo ? ' · ' + e.titulo : ''}`);
    const s = secreto(r); if (s) return h('button.av-link.sec', { onclick: () => ir('secretos', { secreto: s.codigo || s.id }) }, `🔒 ${s.codigo || s.id}`);
    const pi = pista(r); if (pi) return h('button.av-link.pis' + (prog.pistas[pi.codigo || pi.id] ? '.hallada' : ''), { onclick: () => verPista(pi) }, pi.codigo || pi.id);
    return `[${r}]`;
  }

  // Texto con **negrita**, *cursiva* y [[enlaces]]
  function texto(t) {
    const partes = String(t ?? '').split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|\[\[[^\]]+\]\])/g);
    return partes.filter((x) => x !== '').map((x) => {
      if (x.startsWith('**') && x.endsWith('**') && x.length > 4) return h('b', {}, ...texto(x.slice(2, -2)));
      if (x.startsWith('[[') && x.endsWith(']]')) return enlace(x.slice(2, -2));
      if (x.startsWith('*') && x.endsWith('*') && x.length > 2) return h('i', {}, ...texto(x.slice(1, -1)));
      return x;
    });
  }
  const conSaltos = (n) => (typeof n === 'string' ? n.split('\n').flatMap((l, i) => (i ? [h('br'), l] : [l])) : [n]);
  const parrafos = (t, tag = 'p') => String(t ?? '').split(/\n{2,}/).map((x) => h(tag, {}, ...texto(x).flatMap(conSaltos)));

  async function aCronica(t) {
    if (!p) return;
    const limpio = String(t).replace(/\[\[(?:[^\]:]+:)?([^\]]+)\]\]/g, '$1').replace(/\*\*?/g, '');
    try { await crearEnSub(p.id, 'cronica', { autor: estado.usuario.uid, texto: limpio, creada: Date.now() }); toast('Añadido a la crónica: los jugadores ya lo ven.'); }
    catch (e) { toast('No se pudo añadir: ' + e.message); }
  }

  function bloque(b) {
    switch (b.t) {
      case 'h': return h('h4.av-h', {}, ...texto(b.texto));
      case 'leer': return h('div.av-leer', {},
        h('div.av-leer-et', {}, '📖 Leer en voz alta', p && puedeEscribirCronica(p) ? h('button.btn.peq', { title: 'Lo verán los jugadores en la crónica', onclick: () => aCronica(b.texto) }, '✒ A la crónica') : null),
        ...parrafos(b.texto));
      case 'si': return h('div.av-si', {}, h('div.av-si-cond', {}, h('b', {}, 'SI '), ...texto(b.cond)), ...parrafos(b.texto));
      case 'dialogo': return h('div.av-dialogo', {}, h('div.av-quien', {}, '💬 ', ...texto(b.quien)), ...parrafos(b.texto, 'p'));
      case 'nota': return h('div.aviso-caja.av-nota', {}, ...parrafos(b.texto));
      case 'lista': return h(b.num ? 'ol.av-lista' : 'ul.av-lista', {}, (b.items || []).map((x) => h('li', {}, ...texto(x))));
      case 'tabla': return h('div.av-tabla-caja', {}, h('table.av-tabla', {},
        b.cab ? h('thead', {}, h('tr', {}, b.cab.map((c) => h('th', {}, ...texto(c))))) : null,
        h('tbody', {}, (b.filas || []).map((f) => h('tr', {}, f.map((c, i) => h('td', { 'data-l': b.cab?.[i] || '' }, ...texto(c))))))));
      case 'pista': {
        const pi = pista(b.codigo) || { codigo: b.codigo, n: b.n };
        const cod = pi.codigo || b.codigo;
        const chk = h('input', { type: 'checkbox', checked: !!prog.pistas[cod], onchange: (e) => { prog.pistas[cod] = e.target.checked; guardar(); } });
        return h('div.av-pista', {},
          h('label.av-pista-cab', {}, chk, h('b', {}, `[${cod}] `), b.n || pi.n || '', b.prueba ? h('span.av-prueba', {}, ` · ${b.prueba}`) : null),
          b.leer ? h('div.av-leer.mini', {}, ...parrafos(b.leer)) : null,
          b.texto ? h('div', {}, ...parrafos(b.texto)) : null);
      }
      case 'reloj': return av.reloj ? h('div.av-reloj-aviso', {}, h('b', {}, b.delta > 0 ? `${av.reloj.n} +${b.delta}` : `${av.reloj.n} ${b.delta}`), b.texto ? h('span', {}, ' · ', ...texto(b.texto)) : null,
        h('button.btn.peq', { onclick: () => ir('reloj') }, 'Abrir el reloj')) : null;
      case 'combate': { const c = combate(b.ref); return c ? h('div.av-comb-mini', {}, h('b', {}, `⚔ ${c.n}`), h('span.peq', {}, ` ${resumenComb(c)}`), h('button.btn.peq', { onclick: () => ir('combates', { combate: c.id }) }, 'Ver combate')) : null; }
      case 'mapa': { const mp = mapa(b.ref); return mp ? h('button.av-mapa-mini', { onclick: () => verMapa(mp) }, h('img', { src: mp.img, alt: mp.n, loading: 'lazy' }), h('span', {}, `🗺 ${mp.n}`)) : null; }
      case 'ir': return h('div.av-ir', {}, h('span', {}, ...texto(b.texto || '')), ' ', enlace(b.a));
      default: return b.texto ? h('div', {}, ...parrafos(b.texto)) : null;
    }
  }

  const resumenComb = (c) => c.enemigos.map((x) => { const e = enemigo(x.ref); return e ? `${x.c > 1 ? x.c + '× ' : ''}${e.n}` : ''; }).filter(Boolean).join(', ');

  function fichaPNJ(x) {
    const s = x.estad;
    modal(x.n, h('div.av-ficha', {},
      x.rol ? h('p.peq', {}, h('i', {}, x.rol)) : null,
      ...['aspecto', 'voz', 'quiere', 'oculta', 'cuenta', 'frase'].filter((k) => x[k]).map((k) => h('p', {}, h('b', {}, { aspecto: 'Aspecto: ', voz: 'Voz y gestos: ', quiere: 'Quiere: ', oculta: 'Oculta: ', cuenta: 'Cuenta: ', frase: 'Frase: ' }[k]), ...texto(x[k]))),
      s ? h('div.av-estad', {},
        h('div.av-estad-fila', {}, [['CA', s.ca], ['PG', s.pg], ['Vel.', s.vel], ['Ini.', s.ini], ['VD', s.vd]].filter(([, v]) => v != null && v !== '').map(([k, v]) => h('span', {}, h('small', {}, k), h('b', {}, String(v))))),
        s.car ? h('div.av-estad-fila.car', {}, Object.entries(s.car).map(([k, v]) => h('span', {}, h('small', {}, k), h('b', {}, String(v))))) : null,
        ...(s.lineas || []).map((l) => h('p.peq', {}, ...texto(l))),
        (s.acciones || []).length ? h('ul.av-lista', {}, s.acciones.map((l) => h('li', {}, ...texto(l)))) : null) : null,
      x.texto ? h('div', {}, ...parrafos(x.texto)) : null,
    ));
  }
  function verPista(pi) {
    const cod = pi.codigo || pi.id;
    const chk = h('input', { type: 'checkbox', checked: !!prog.pistas[cod], onchange: (e) => { prog.pistas[cod] = e.target.checked; guardar(); } });
    modal(`[${cod}] ${pi.n || ''}`, h('div', {},
      pi.donde ? h('p', {}, h('b', {}, 'Dónde: '), ...texto(pi.donde)) : null,
      pi.demuestra ? h('p', {}, h('b', {}, 'Qué demuestra: '), ...texto(pi.demuestra)) : null,
      pi.siFallan ? h('p', {}, h('b', {}, 'Si fallan: '), ...texto(pi.siFallan)) : null,
      h('label.av-pista-cab', {}, chk, ' Encontrada por los jugadores')));
  }
  function verMapa(mp) {
    const fondo = h('div.av-mapa-grande', { onclick: () => fondo.remove() },
      h('img', { src: mp.img, alt: mp.n }), h('div.av-mapa-pie', {}, mp.n, mp.soloDM ? ' · 🔒 solo DM' : ' · para jugadores', ' — toca para cerrar'));
    document.body.append(fondo);
  }

  // --- Pestañas ---
  function pintarEscenas() {
    const actual = escena(prog.escena) || av.escenas[0];
    const i = av.escenas.indexOf(actual);
    const chips = h('div.chips.av-chips', {}, av.escenas.map((e) => h('button.chip' + (e === actual ? '.sel' : ''), { onclick: () => ir('escenas', { escena: e.id }) }, e.codigo || e.id)));
    return [chips,
      h('article.av-escena', {},
        h('h3', {}, actual.codigo ? `${actual.codigo} · ` : '', actual.titulo || ''),
        actual.duracion || actual.resumen ? h('p.ayuda', {}, actual.duracion ? `⏱ ${actual.duracion}. ` : '', ...texto(actual.resumen || '')) : null,
        ...actual.bloques.map(bloque)),
      h('div.av-nav', {},
        i > 0 ? h('button.btn', { onclick: () => ir('escenas', { escena: av.escenas[i - 1].id }) }, `← ${av.escenas[i - 1].codigo || 'Anterior'}`) : h('span'),
        i < av.escenas.length - 1 ? h('button.btn.rojo', { onclick: () => ir('escenas', { escena: av.escenas[i + 1].id }) }, `${av.escenas[i + 1].codigo || 'Siguiente'} →`) : h('span'))];
  }
  function pintarSecretos() {
    return [h('p.ayuda', {}, 'Lo que solo sabes tú. Los códigos coinciden con los enlaces 🔒 de las escenas.'),
      ...av.secretos.map((s) => {
        const d = h('details.av-secreto', { open: prog.secreto === (s.codigo || s.id) }, h('summary', {}, h('b', {}, s.codigo ? `${s.codigo} · ` : ''), s.titulo || ''), ...s.bloques.map(bloque));
        if (prog.secreto === (s.codigo || s.id)) setTimeout(() => d.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
        return d;
      })];
  }
  function pintarPNJ() {
    return [h('div.lista-av', {}, av.pnj.map((x) => h('button.tarjeta-av.pnj', { onclick: () => fichaPNJ(x) }, h('strong', {}, x.n), x.rol ? h('span', {}, x.rol) : null,
      x.estad ? h('small', {}, [x.estad.ca != null && `CA ${x.estad.ca}`, x.estad.pg != null && `PG ${x.estad.pg}`].filter(Boolean).join(' · ')) : null)))];
  }
  function pintarPistas() {
    const n = av.pistas.filter((x) => prog.pistas[x.codigo || x.id]).length;
    return [h('p.ayuda', {}, `Encontradas: ${n} de ${av.pistas.length}. Marca las que vayan consiguiendo los jugadores.`),
      h('div.av-pistas', {}, av.pistas.map((x) => {
        const cod = x.codigo || x.id;
        return h('div.av-pista' + (prog.pistas[cod] ? '.hallada' : ''), {},
          h('label.av-pista-cab', {}, h('input', { type: 'checkbox', checked: !!prog.pistas[cod], onchange: (e) => { prog.pistas[cod] = e.target.checked; guardar(); pintar(); } }), h('b', {}, `[${cod}] `), x.n || ''),
          x.donde ? h('p.peq', {}, h('b', {}, 'Dónde: '), ...texto(x.donde)) : null,
          x.demuestra ? h('p.peq', {}, h('b', {}, 'Demuestra: '), ...texto(x.demuestra)) : null,
          x.siFallan ? h('p.peq', {}, h('b', {}, 'Si fallan: '), ...texto(x.siFallan)) : null);
      }))];
  }
  function pintarCombates() {
    const puede = p && gestionaIniciativa(p);
    return [!p ? h('p.ayuda', {}, 'Abre esta aventura desde la pestaña «Aventura» de una partida para mandar los enemigos a la iniciativa.') : null,
      ...av.combates.map((c) => {
        const filas = c.enemigos.map((x) => ({ ...x, e: enemigo(x.ref) })).filter((x) => x.e);
        const d = h('details.av-combate', { open: prog.combate === c.id },
          h('summary', {}, h('b', {}, c.n), c.escena ? h('span.peq', {}, ` · ${c.escena}`) : null, c.px ? h('span.peq', {}, ` · ${c.px} PX`) : null, c.dificultad ? h('span.peq', {}, ` · ${c.dificultad}`) : null),
          h('div.av-tabla-caja', {}, h('table.av-tabla', {}, h('thead', {}, h('tr', {}, ['Quién', 'Nº', 'CA', 'PG', 'Ini.'].map((t) => h('th', {}, t)))),
            h('tbody', {}, filas.map(({ e, c: n }) => h('tr', {}, h('td', {}, e.ficha && pnj(e.ficha) ? h('button.av-link.pnj', { onclick: () => fichaPNJ(pnj(e.ficha)) }, e.n) : e.n, e.tipo === 'aliado' ? ' (aliado)' : '', e.oculto ? ' 🔒' : ''),
              h('td', {}, String(n || 1)), h('td', {}, e.ca ?? '—'), h('td', {}, e.pg ?? '—'), h('td', {}, e.bon != null ? (e.bon >= 0 ? '+' : '') + e.bon : '—')))))),
          ...(c.bloques || []).map(bloque),
          c.notas ? h('div', {}, ...parrafos(c.notas)) : null,
          puede ? h('div.acciones', {},
            h('button.btn.rojo', { onclick: () => aIniciativa(filas) }, '⚔ Añadir a la iniciativa'),
            h('button.btn', { onclick: () => aGuardados(filas) }, '💾 Guardar en la partida')) : null);
        d.addEventListener('toggle', () => { if (d.open) { prog.combate = c.id; guardar(); } });
        return d;
      })];
  }
  async function aIniciativa(filas) {
    try {
      for (const { e, c } of filas) {
        const n = Number(c || 1);
        for (let i = 1; i <= n; i++) {
          await crearEnSub(p.id, 'iniciativa', { n: n > 1 ? `${e.n} ${i}` : e.n, tipo: e.tipo || 'enemigo', bon: e.bon || 0, ini: null, pg: e.pg ?? null, pgMax: e.pg ?? null, ca: e.ca ?? null, notas: e.notas || '', oculto: !!e.oculto, creada: Date.now() });
        }
      }
      toast('Enemigos añadidos. En «Iniciativa», tira las que faltan y pulsa «Empezar».');
      ctx.irA?.(`#/partidas/${p.id}/iniciativa`);
    } catch (err) { toast('No se pudo: ' + err.message); }
  }
  async function aGuardados(filas) {
    const existentes = await new Promise((res) => { let fin = null; fin = escucharSub(p.id, 'plantillas', (docs) => { res(docs || []); setTimeout(() => fin && fin(), 0); }); });
    let n = 0;
    try {
      for (const { e } of filas) {
        if (existentes.some((x) => x.n.toLowerCase() === e.n.toLowerCase())) continue;
        await crearEnSub(p.id, 'plantillas', { n: e.n, tipo: e.tipo || 'enemigo', bon: e.bon || 0, pg: e.pg ?? null, ca: e.ca ?? null, notas: e.notas || '', oculto: !!e.oculto, creada: Date.now() });
        existentes.push({ n: e.n }); n++;
      }
      toast(n ? `${n} guardado(s) en «Guardados de la partida».` : 'Ya estaban todos guardados.');
    } catch (err) { toast('No se pudo: ' + err.message); }
  }
  function pintarReloj() {
    const r = av.reloj;
    const on = prog.reloj.filter(Boolean).length;
    const peligro = r.umbral != null && on <= r.umbral;
    return [
      h('div.av-reloj-total' + (peligro ? '.peligro' : ''), {}, h('b', {}, `${on} / ${r.items.length}`), ` ${r.n || ''}`, r.umbral != null ? h('span.peq', {}, ` · umbral: ${r.umbral}`) : null),
      r.texto ? h('div.ayuda', {}, ...parrafos(r.texto)) : null,
      h('div.av-reloj', {}, r.items.map((x, i) => h('button.av-ficha-reloj' + (prog.reloj[i] ? '.on' : ''), { onclick: () => { prog.reloj[i] = !prog.reloj[i]; guardar(); pintar(); } },
        h('span.llama', {}, prog.reloj[i] ? '🔥' : '·'), h('span', {}, x.n)))),
      h('div.acciones', {}, h('button.btn.peq', { onclick: async () => { if (await confirmar('Reiniciar reloj', 'Vuelve al estado inicial de la aventura.', 'Reiniciar')) { prog.reloj = r.items.map((x) => !!x.on); guardar(); pintar(); } } }, '↺ Estado inicial')),
    ];
  }
  function pintarMapas() {
    return [h('div.av-mapas', {}, av.mapas.map((m) => h('button.av-mapa-mini', { onclick: () => verMapa(m) }, h('img', { src: m.img, alt: m.n, loading: 'lazy' }),
      h('span', {}, m.n, h('small', {}, m.soloDM ? ' · 🔒 solo DM' : ' · para jugadores')), m.nota ? h('small', {}, m.nota) : null)))];
  }

  function pintarRelojMini() {
    if (!av.reloj) { relojMini.replaceChildren(); return; }
    const on = prog.reloj.filter(Boolean).length;
    relojMini.replaceChildren(h('button.chip' + (av.reloj.umbral != null && on <= av.reloj.umbral ? '.sel.rojo' : ''), { onclick: () => ir('reloj') }, `🔥 ${av.reloj.n || 'Reloj'}: ${on}/${av.reloj.items.length}`));
  }

  function pintar() {
    const tabs = PESTANAS.filter(([, , f]) => f(av));
    if (!tabs.some(([id]) => id === prog.tab)) prog.tab = 'escenas';
    pest.replaceChildren(...tabs.map(([id, t]) => h('button' + (prog.tab === id ? '.sel' : ''), { onclick: () => ir(id) }, t)));
    const f = { escenas: pintarEscenas, secretos: pintarSecretos, pnj: pintarPNJ, pistas: pintarPistas, combates: pintarCombates, reloj: pintarReloj, mapas: pintarMapas }[prog.tab];
    cuerpo.replaceChildren(...f().flat().filter(Boolean));
    pintarRelojMini();
  }

  const menu = async () => {
    const r = await modal(av.titulo, h('p.peq', {}, 'Opciones de la aventura'), [
      { t: '⬇ Exportar (copia de seguridad)', v: 'exp' },
      { t: '↺ Reiniciar progreso (escena, pistas, reloj)', v: 'rei' },
      ctx.alDesvincular ? { t: '⇄ Usar otra aventura en esta partida', v: 'desv' } : null,
      { t: av.nube ? '🗑 Borrar de mi cuenta' : '🗑 Borrar de este dispositivo', v: 'borrar', clase: 'rojo' },
      { t: 'Cerrar', v: null },
    ].filter(Boolean), { vertical: true });
    if (r === 'exp') { const { importada, nube, progresoNube, ...limpio } = av; descargar(nombreArchivoAv(av.titulo), JSON.stringify(limpio, null, 1)); toast('Aventura descargada.'); }
    if (r === 'rei' && await confirmar('Reiniciar progreso', 'Vuelve a la primera escena, desmarca las pistas y deja el reloj como al principio.', 'Reiniciar')) { reiniciarProgreso(av); Object.assign(prog, leerProgreso(av)); pintar(); }
    if (r === 'desv') ctx.alDesvincular();
    if (r === 'borrar' && await confirmar('Borrar aventura', `Se borrará «${av.titulo}» ${av.nube ? 'de tu cuenta (en todos tus dispositivos)' : 'de este dispositivo'}. Si no tienes una copia del archivo, no podrás recuperarla.`, 'Borrar')) { await borrarAventura(av); toast('Aventura borrada.'); if (ctx.alDesvincular) ctx.alDesvincular(); else ctx.irA('#/aventuras'); }
  };

  caja.replaceChildren(
    h('div.av-cab', {},
      h('div', {}, h('h2', {}, av.titulo), av.subtitulo ? h('p.peq', {}, av.subtitulo) : null,
        h('p.peq', {}, [av.nivel && `Nivel ${av.nivel}`, av.jugadores && `${av.jugadores} jugadores`, av.duracion, av.reglas].filter(Boolean).join(' · '))),
      h('button.btn.peq', { onclick: menu, title: 'Opciones' }, '⋯')),
    av.avisoMapas ? h('div.aviso-caja', {}, av.avisoMapas) : null,
    relojMini, pest, cuerpo);
  pintar();
  alSalir(() => guardar());
}
