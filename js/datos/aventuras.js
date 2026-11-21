// Aventuras del DM.
// Con la sesión de Google iniciada se guardan en tu cuenta (Firestore), solo legibles por ti,
// y aparecen en todos tus dispositivos. Sin sesión, se guardan en este dispositivo (IndexedDB).
// Formato descrito en AVENTURAS.md.
import {
  estado, fbListo, aventurasNube, mapasAventuraNube, guardarAventuraNube, borrarAventuraNube, progresoAventuraNube, actualizarPartida,
} from '../almacen.js';

// ---------- Este dispositivo (IndexedDB) ----------
const DB = 'senda-aventuras';
const ALMACEN = 'aventuras';
let dbPromesa = null;
function abrir() {
  if (dbPromesa) return dbPromesa;
  dbPromesa = new Promise((res, rej) => {
    if (!('indexedDB' in globalThis)) return rej(new Error('Este navegador no permite guardar aventuras.'));
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(ALMACEN)) r.result.createObjectStore(ALMACEN, { keyPath: 'id' }); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbPromesa;
}
async function op(modo, fn) {
  const db = await abrir();
  return new Promise((res, rej) => {
    const tx = db.transaction(ALMACEN, modo);
    const r = fn(tx.objectStore(ALMACEN));
    tx.oncomplete = () => res(r?.result);
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error || new Error('Operación cancelada (¿sin espacio?).'));
  });
}
const locales = async () => { try { return (await op('readonly', (s) => s.getAll())) || []; } catch { return []; } };

// ---------- Cuenta (Firestore) ----------
const idMapa = (mid) => String(mid).replace(/[^\w-]/g, '_');
const enNube = () => fbListo();
let cacheNube = null; // { uid, lista: [resumen + json] }
const completas = new Map(); // id → aventura con mapas
let errorCarga = null;
export const ultimoErrorCarga = () => errorCarga;

function separar(av) {
  const mapas = {};
  const sinImg = { ...av, mapas: (av.mapas || []).map((m) => { if (m.img) mapas[m.id] = m.img; const { img, ...r } = m; return { ...r, nube: !!img }; }) };
  const { importada, nube, progresoNube, ...contenido } = sinImg;
  return {
    datos: { id: av.id, titulo: av.titulo, subtitulo: av.subtitulo || '', nivel: av.nivel || '', jugadores: av.jugadores || '', duracion: av.duracion || '', nEscenas: av.escenas.length, importada: av.importada || Date.now(), actualizada: Date.now(), json: JSON.stringify(contenido) },
    mapas,
  };
}
const resumen = (d) => ({ id: d.id, titulo: d.titulo, subtitulo: d.subtitulo, nivel: d.nivel, jugadores: d.jugadores, duracion: d.duracion, escenas: { length: d.nEscenas || 0 }, importada: d.importada, nube: true });

async function listaNube() {
  const uid = estado.usuario?.uid;
  if (!cacheNube || cacheNube.uid !== uid) cacheNube = { uid, lista: await aventurasNube() };
  return cacheNube.lista;
}

// ---------- API ----------
// Lista para mostrar: las de la cuenta (si hay sesión) y las que sigan solo en este dispositivo
export async function listarAventuras() {
  const loc = (await locales()).map((a) => ({ ...a, nube: false }));
  let nube = [];
  if (enNube()) { try { nube = (await listaNube()).map(resumen); } catch (e) { console.warn(e); } }
  const ids = new Set(nube.map((a) => a.id));
  return [...nube, ...loc.filter((a) => !ids.has(a.id))].sort((a, b) => (b.importada || 0) - (a.importada || 0));
}
export const hayAventurasLocales = async () => (await locales()).length;

export async function obtenerAventura(id) {
  errorCarga = null;
  if (completas.has(id)) return completas.get(id);
  if (enNube()) {
    try {
      const d = (await listaNube()).find((x) => x.id === id);
      if (d) {
        const av = { ...JSON.parse(d.json), importada: d.importada, nube: true, progresoNube: d.progreso || null };
        let imgs = {};
        if (av.mapas.some((m) => m.nube)) {
          try { imgs = await mapasAventuraNube(id); } catch (e) { console.warn('Mapas', e); av.avisoMapas = 'No se pudieron cargar los mapas de tu cuenta. El resto de la aventura funciona.'; }
        }
        av.mapas = av.mapas.map((m) => ({ ...m, img: m.img || imgs[idMapa(m.id)] || '' }));
        completas.set(id, av);
        return av;
      }
    } catch (e) { console.warn(e); errorCarga = e; }
  }
  const loc = (await locales()).find((a) => a.id === id);
  return loc ? { ...loc, nube: false } : null;
}

// Guarda en la cuenta si hay sesión; si falla (p. ej. reglas sin actualizar), en este dispositivo
export async function guardarAventura(av) {
  completas.delete(av.id);
  if (enNube()) {
    try {
      const { datos, mapas } = separar(av);
      await guardarAventuraNube(datos, mapas);
      cacheNube = null;
      await op('readwrite', (s) => s.delete(av.id)).catch(() => {});
      return { ...av, nube: true };
    } catch (e) {
      console.warn(e);
      await op('readwrite', (s) => s.put({ ...av, nube: false }));
      const err = new Error(String(e.code || e.message).includes('permission')
        ? 'Guardada solo en este dispositivo: falta actualizar las reglas de Firestore (ver FIREBASE.md).'
        : 'Guardada solo en este dispositivo: no se pudo subir a tu cuenta.');
      err.guardadaLocal = true; throw err;
    }
  }
  await op('readwrite', (s) => s.put({ ...av, nube: false }));
  return { ...av, nube: false };
}

export async function borrarAventura(av) {
  completas.delete(av.id);
  if (av.nube && enNube()) { await borrarAventuraNube(av.id, (av.mapas || []).map((m) => idMapa(m.id))); cacheNube = null; }
  await op('readwrite', (s) => s.delete(av.id)).catch(() => {});
  try { localStorage.removeItem(claveProg(av.id)); } catch { /* */ }
}

// Sube a la cuenta las aventuras guardadas solo en este dispositivo
export async function subirAventurasLocales() {
  let n = 0;
  for (const av of await locales()) { await guardarAventura(av); n++; }
  return n;
}

// Comprueba el archivo y rellena lo que falte
export function normalizarAventura(datos) {
  const av = datos?.aventura || datos;
  if (!av || av.formato !== 'senda-aventura') throw new Error('El archivo no es una aventura de La Senda del Errante.');
  if (!av.titulo || !Array.isArray(av.escenas) || !av.escenas.length) throw new Error('A la aventura le falta el título o las escenas.');
  const lista = (x) => (Array.isArray(x) ? x : []);
  const conId = (arr, pref) => lista(arr).map((x, i) => ({ ...x, id: String(x.id || x.codigo || `${pref}${i + 1}`) }));
  const { nube, progresoNube, ...limpio } = av;
  return {
    ...limpio,
    id: String(av.id || 'av_' + Date.now().toString(36)).replace(/[^\w-]/g, '_'),
    escenas: conId(av.escenas, 'E').map((e) => ({ ...e, bloques: lista(e.bloques) })),
    secretos: conId(av.secretos, 'S').map((e) => ({ ...e, bloques: lista(e.bloques) })),
    pnj: conId(av.pnj, 'pnj'),
    pistas: conId(av.pistas, 'P'),
    enemigos: conId(av.enemigos, 'en'),
    combates: conId(av.combates, 'c').map((c) => ({ ...c, enemigos: lista(c.enemigos) })),
    mapas: conId(av.mapas, 'm'),
    reloj: av.reloj && Array.isArray(av.reloj.items) && av.reloj.items.length ? av.reloj : null,
    importada: Date.now(),
  };
}

// ---------- Progreso (escena, pistas, reloj): en el dispositivo y, si está en tu cuenta, también allí ----------
const claveProg = (id) => `senda.aventura.prog.${id}`;
export function leerProgreso(av) {
  let p = {};
  try { p = JSON.parse(localStorage.getItem(claveProg(av.id)) || '{}'); } catch { /* */ }
  if (av.progresoNube) { try { const n = JSON.parse(av.progresoNube); if ((n.t || 0) > (p.t || 0)) p = n; } catch { /* */ } }
  return {
    tab: 'escenas', escena: av.escenas[0]?.id, pistas: {}, notas: '',
    reloj: av.reloj ? av.reloj.items.map((x) => !!x.on) : [],
    ...p,
  };
}
const temporizadores = new Map();
export function guardarProgreso(av, prog) {
  prog.t = Date.now();
  const txt = JSON.stringify(prog);
  try { localStorage.setItem(claveProg(av.id), txt); } catch { /* */ }
  if (av.nube && enNube()) {
    av.progresoNube = txt;
    clearTimeout(temporizadores.get(av.id));
    temporizadores.set(av.id, setTimeout(() => progresoAventuraNube(av.id, txt).catch((e) => console.warn(e)), 1500));
  }
}
export function reiniciarProgreso(av) {
  try { localStorage.removeItem(claveProg(av.id)); } catch { /* */ }
  av.progresoNube = null;
  if (av.nube && enNube()) progresoAventuraNube(av.id, null).catch(() => {});
}

// ---------- Qué aventura usa cada partida ----------
// Se guarda en la partida (así la ves en todos tus dispositivos) y, de respaldo, en este dispositivo.
const CLAVE_PARTIDAS = 'senda.aventuraDePartida';
export function aventuraDePartida(p) {
  if (p.aventura) return p.aventura;
  try { return JSON.parse(localStorage.getItem(CLAVE_PARTIDAS) || '{}')[p.id] || null; } catch { return null; }
}
export async function vincularAventura(p, aid) {
  let m = {};
  try { m = JSON.parse(localStorage.getItem(CLAVE_PARTIDAS) || '{}'); } catch { /* */ }
  if (aid) m[p.id] = aid; else delete m[p.id];
  try { localStorage.setItem(CLAVE_PARTIDAS, JSON.stringify(m)); } catch { /* */ }
  p.aventura = aid || null;
  if (enNube()) { try { await actualizarPartida(p.id, { aventura: aid || null }); } catch (e) { console.warn(e); } }
}
