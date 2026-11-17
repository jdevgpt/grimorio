// Almacenamiento: local (este dispositivo) o nube (Firebase) si está configurado y has entrado.
import { firebaseConfig } from './firebase-config.js';
import { guardarLocal, leerLocal } from './ui.js';
import { REGLAS_DEFECTO, conDefecto } from './datos/opciones.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
const CLAVE = 'senda.personajes';

export const estado = {
  nube: !!firebaseConfig, usuario: null, listo: false,
  personajes: leerLocal(CLAVE, {}), // id → pj
  partidas: [],
};
const oyentes = new Set();
export const alCambiar = (fn) => { oyentes.add(fn); return () => oyentes.delete(fn); };
const avisar = () => oyentes.forEach((fn) => fn(estado));

let fb = null; // { auth, db, m: módulos }
let desuscribir = [];

export async function iniciar() {
  if (!firebaseConfig) { estado.listo = true; avisar(); return; }
  try {
    const [appM, authM, fsM] = await Promise.all([
      import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-auth.js`), import(`${SDK}/firebase-firestore.js`),
    ]);
    const app = appM.initializeApp(firebaseConfig);
    const auth = authM.getAuth(app);
    let db;
    try { db = fsM.initializeFirestore(app, { localCache: fsM.persistentLocalCache({ tabManager: fsM.persistentMultipleTabManager() }) }); }
    catch { db = fsM.getFirestore(app); }
    fb = { auth, db, a: authM, f: fsM };
    try { await authM.getRedirectResult(auth); } catch { /* sin redirección pendiente */ }
    authM.onAuthStateChanged(auth, (u) => {
      estado.usuario = u ? { uid: u.uid, nombre: u.displayName || u.email, foto: u.photoURL } : null;
      escuchar();
      estado.listo = true; avisar();
    });
  } catch (e) {
    console.warn('Firebase no disponible:', e);
    estado.nube = false; estado.listo = true; avisar();
  }
}

function escuchar() {
  desuscribir.forEach((f) => f()); desuscribir = [];
  if (!estado.usuario) { estado.personajes = leerLocal(CLAVE, {}); estado.partidas = []; return; }
  const { db, f } = fb; const uid = estado.usuario.uid;
  desuscribir.push(f.onSnapshot(f.query(f.collection(db, 'personajes'), f.where('lectores', 'array-contains', uid)), (snap) => {
    const nuevos = {};
    snap.forEach((d) => { nuevos[d.id] = d.data(); });
    estado.personajes = nuevos; avisar();
  }, (e) => console.warn(e)));
  desuscribir.push(f.onSnapshot(f.query(f.collection(db, 'partidas'), f.where('miembros', 'array-contains', uid)), (snap) => {
    estado.partidas = snap.docs.map((d) => ({ id: d.id, ...d.data() })); avisar();
  }, (e) => console.warn(e)));
}

export async function entrar() {
  const { auth, a } = fb; const prov = new a.GoogleAuthProvider();
  try { await a.signInWithPopup(auth, prov); }
  catch (e) { if (String(e.code).includes('popup')) await a.signInWithRedirect(auth, prov); else throw e; }
}
export async function salir() { await fb.a.signOut(fb.auth); }

export const misPersonajes = () => Object.values(estado.personajes).filter((p) => !estado.usuario || p.owner === estado.usuario.uid).sort((a, b) => (b.actualizado || 0) - (a.actualizado || 0));
export const personaje = (id) => estado.personajes[id];
export const esMio = (pj) => !estado.usuario || pj.owner === estado.usuario.uid;
export const soyDMde = (pj) => !!estado.usuario && !!pj.partida && pj.partidaDm === estado.usuario.uid && pj.owner !== estado.usuario.uid;

const pendientes = new Map();
export function guardar(pj, inmediato = false) {
  pj.actualizado = Date.now();
  estado.personajes[pj.id] = pj;
  if (!estado.usuario) { guardarLocal(CLAVE, estado.personajes); avisar(); return Promise.resolve(); }
  if (!pj.owner || pj.owner === estado.usuario.uid) {
    pj.owner = estado.usuario.uid; pj.ownerNombre = estado.usuario.nombre;
    pj.lectores = lectoresDe(pj);
  } // si lo guarda el DM, no cambia ni el dueño ni quién puede leerlo
  clearTimeout(pendientes.get(pj.id));
  const escribir = () => fb.f.setDoc(fb.f.doc(fb.db, 'personajes', pj.id), JSON.parse(JSON.stringify(pj))).catch((e) => console.warn(e));
  if (inmediato) return escribir();
  pendientes.set(pj.id, setTimeout(escribir, 500));
  return Promise.resolve();
}

function lectoresDe(pj) {
  const l = new Set([pj.owner]);
  if (pj.partida && pj.partidaDm) l.add(pj.partidaDm);
  return [...l];
}

export async function borrar(id) {
  delete estado.personajes[id];
  if (!estado.usuario) { guardarLocal(CLAVE, estado.personajes); avisar(); return; }
  await fb.f.deleteDoc(fb.f.doc(fb.db, 'personajes', id));
}

// Sube a la nube los personajes guardados en este dispositivo
export async function subirLocales() {
  const locales = Object.values(leerLocal(CLAVE, {}));
  for (const pj of locales) await guardar({ ...pj }, true);
  guardarLocal(CLAVE, {});
  return locales.length;
}
export const hayLocales = () => Object.keys(leerLocal(CLAVE, {})).length;

// ---------- Partidas ----------
const codigoAleatorio = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('');

export async function crearPartida(nombre) {
  const { db, f } = fb; const u = estado.usuario;
  const ref = await f.addDoc(f.collection(db, 'partidas'), { nombre, dm: u.uid, dmNombre: u.nombre, codigo: codigoAleatorio(), miembros: [u.uid], creada: Date.now(), reglas: { ...REGLAS_DEFECTO }, nombres: { [u.uid]: u.nombre }, escritores: [], gestoresIni: [], iniPropia: true });
  return ref.id;
}

export async function unirsePartida(codigo) {
  const { db, f } = fb; const uid = estado.usuario.uid;
  const snap = await f.getDocs(f.query(f.collection(db, 'partidas'), f.where('codigo', '==', codigo.toUpperCase().trim())));
  if (snap.empty) throw new Error('No existe ninguna partida con ese código.');
  const d = snap.docs[0];
  if (!d.data().miembros.includes(uid)) await f.updateDoc(d.ref, { miembros: f.arrayUnion(uid), [`nombres.${uid}`]: estado.usuario.nombre });
  return { id: d.id, ...d.data() };
}

export async function asignarPartida(pj, partida) {
  pj.partida = partida?.id || null;
  pj.partidaDm = partida?.dm || null;
  pj.partidaNombre = partida?.nombre || null;
  await guardar(pj, true);
}

export async function borrarPartida(id) { await fb.f.deleteDoc(fb.f.doc(fb.db, 'partidas', id)); }
export async function expulsar(partida, uid) {
  await fb.f.updateDoc(fb.f.doc(fb.db, 'partidas', partida.id), { miembros: partida.miembros.filter((m) => m !== uid) });
}
export const personajesDePartida = (pid) => Object.values(estado.personajes).filter((p) => p.partida === pid);

export async function guardarReglas(pid, reglas) {
  await fb.f.updateDoc(fb.f.doc(fb.db, 'partidas', pid), { reglas });
}
// Reglas de la partida del personaje (null si no está en ninguna)
export function reglasDe(pj) {
  if (!pj?.partida) return null;
  const p = estado.partidas.find((x) => x.id === pj.partida);
  return p ? conDefecto(p.reglas) : null;
}

// ---------- Subcolecciones de la partida (crónica e iniciativa) ----------
export const fbListo = () => !!fb && !!estado.usuario;
const ruta = (...p) => p.join('/');

export function escucharSub(pid, sub, cb) {
  if (!fbListo()) return () => {};
  const { db, f } = fb;
  return f.onSnapshot(f.collection(db, ruta('partidas', pid, sub)), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (e) => { console.warn(e); cb(null, e); });
}
export function escucharDoc(pid, sub, id, cb) {
  if (!fbListo()) return () => {};
  const { db, f } = fb;
  return f.onSnapshot(f.doc(db, ruta('partidas', pid, sub, id)), (d) => cb(d.exists() ? d.data() : null), (e) => console.warn(e));
}
export async function crearEnSub(pid, sub, datos) {
  const { db, f } = fb;
  const r = await f.addDoc(f.collection(db, ruta('partidas', pid, sub)), datos);
  return r.id;
}
export const escribirEnSub = (pid, sub, id, datos, fusionar = true) => fb.f.setDoc(fb.f.doc(fb.db, ruta('partidas', pid, sub, id)), datos, { merge: fusionar });
export const borrarEnSub = (pid, sub, id) => fb.f.deleteDoc(fb.f.doc(fb.db, ruta('partidas', pid, sub, id)));
export const actualizarPartida = (pid, campos) => fb.f.updateDoc(fb.f.doc(fb.db, 'partidas', pid), campos);

// Guarda el nombre del usuario en la partida para que los demás lo vean
export async function registrarNombre(p) {
  if (!estado.usuario || p.nombres?.[estado.usuario.uid] === estado.usuario.nombre) return;
  try { await actualizarPartida(p.id, { [`nombres.${estado.usuario.uid}`]: estado.usuario.nombre }); } catch (e) { console.warn(e); }
}
export const nombreDe = (p, uid) => p.nombres?.[uid] || (uid === p.dm ? p.dmNombre : 'Jugador');
export const soyDMDe = (p) => estado.usuario?.uid === p.dm;
export const puedeEscribirCronica = (p) => soyDMDe(p) || (p.escritores || []).includes(estado.usuario?.uid);
export const gestionaIniciativa = (p) => soyDMDe(p) || (p.gestoresIni || []).includes(estado.usuario?.uid);
