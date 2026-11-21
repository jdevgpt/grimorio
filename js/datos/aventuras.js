// Aventuras del DM: se guardan solo en este dispositivo (IndexedDB), porque llevan secretos
// que los jugadores no deben ver. Se pueden exportar e importar como archivo .json.
// Formato descrito en AVENTURAS.md.

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

let cache = null; // lista en memoria
export async function listarAventuras() {
  if (!cache) cache = (await op('readonly', (s) => s.getAll())) || [];
  return [...cache].sort((a, b) => (b.importada || 0) - (a.importada || 0));
}
export async function obtenerAventura(id) { return (await listarAventuras()).find((a) => a.id === id) || null; }
export async function guardarAventura(av) {
  await op('readwrite', (s) => s.put(av));
  if (cache) { const i = cache.findIndex((x) => x.id === av.id); if (i >= 0) cache[i] = av; else cache.push(av); }
  return av;
}
export async function borrarAventura(id) {
  await op('readwrite', (s) => s.delete(id));
  if (cache) cache = cache.filter((x) => x.id !== id);
  try { localStorage.removeItem(claveProg(id)); } catch { /* */ }
}

// Comprueba el archivo y rellena lo que falte
export function normalizarAventura(datos) {
  const av = datos?.aventura || datos;
  if (!av || av.formato !== 'senda-aventura') throw new Error('El archivo no es una aventura de La Senda del Errante.');
  if (!av.titulo || !Array.isArray(av.escenas) || !av.escenas.length) throw new Error('A la aventura le falta el título o las escenas.');
  const lista = (x) => (Array.isArray(x) ? x : []);
  const conId = (arr, pref) => lista(arr).map((x, i) => ({ ...x, id: String(x.id || x.codigo || `${pref}${i + 1}`) }));
  return {
    ...av,
    id: String(av.id || 'av_' + Date.now().toString(36)),
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

// Progreso de la partida (escena actual, pistas encontradas, reloj…), también solo en este dispositivo
const claveProg = (id) => `senda.aventura.prog.${id}`;
export function leerProgreso(av) {
  let p = {};
  try { p = JSON.parse(localStorage.getItem(claveProg(av.id)) || '{}'); } catch { /* */ }
  return {
    tab: 'escenas', escena: av.escenas[0]?.id, pistas: {}, notas: '',
    reloj: av.reloj ? av.reloj.items.map((x) => !!x.on) : [],
    ...p,
  };
}
export function guardarProgreso(av, prog) { try { localStorage.setItem(claveProg(av.id), JSON.stringify(prog)); } catch { /* */ } }
export function reiniciarProgreso(av) { try { localStorage.removeItem(claveProg(av.id)); } catch { /* */ } }

// Qué aventura usa cada partida en este dispositivo
const CLAVE_PARTIDAS = 'senda.aventuraDePartida';
export function aventuraDePartida(pid) { try { return JSON.parse(localStorage.getItem(CLAVE_PARTIDAS) || '{}')[pid] || null; } catch { return null; } }
export function vincularAventura(pid, aid) {
  let m = {};
  try { m = JSON.parse(localStorage.getItem(CLAVE_PARTIDAS) || '{}'); } catch { /* */ }
  if (aid) m[pid] = aid; else delete m[pid];
  try { localStorage.setItem(CLAVE_PARTIDAS, JSON.stringify(m)); } catch { /* */ }
}
