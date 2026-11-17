// Contenido de vuestro libro: trasfondos, especies y dotes que no están en el SRD.
// Se guarda en este dispositivo (contenido personal) o en la partida (lo crea el DM para toda la mesa),
// y se copia dentro de cada personaje que lo usa, para que la hoja funcione en cualquier móvil.
import { TRASFONDOS, DOTES } from './trasfondos.js';
import { ESPECIES } from './especies.js';

const CLAVE = 'senda.contenido';
export const VACIO = () => ({ trasfondos: [], especies: [], dotes: [] });

export function leerPersonal() { try { return { ...VACIO(), ...JSON.parse(localStorage.getItem(CLAVE) || '{}') }; } catch { return VACIO(); } }
export function guardarPersonal(c) { try { localStorage.setItem(CLAVE, JSON.stringify(c)); } catch { /* */ } registrar(c); }

const lista = { trasfondos: TRASFONDOS, especies: ESPECIES, dotes: DOTES };
function meter(arr, item) {
  const i = arr.findIndex((x) => x.id === item.id);
  if (i >= 0) arr[i] = item; else arr.push(item);
}
export function registrar(c) {
  if (!c) return;
  for (const k of ['trasfondos', 'especies', 'dotes']) for (const x of c[k] || []) meter(lista[k], normalizar(k, x));
}
export function quitarRegistro(k, id) { const arr = lista[k]; const i = arr.findIndex((x) => x.id === id && x.custom); if (i >= 0) arr.splice(i, 1); }

export function registrarDePJ(pj) {
  const e = pj?.personalizado;
  if (!e) return;
  if (e.trasfondo && !TRASFONDOS.some((x) => x.id === e.trasfondo.id)) TRASFONDOS.push(normalizar('trasfondos', e.trasfondo));
  if (e.especie && !ESPECIES.some((x) => x.id === e.especie.id)) ESPECIES.push(normalizar('especies', e.especie));
  for (const d of e.dotes || []) if (!DOTES.some((x) => x.id === d.id)) DOTES.push(normalizar('dotes', d));
}

// Copia en el personaje las definiciones personalizadas que usa
export function embeber(pj) {
  const tf = TRASFONDOS.find((x) => x.id === pj.trasfondo && x.custom);
  const es = ESPECIES.find((x) => x.id === pj.especie && x.custom);
  const ids = [tf?.dote, ...(pj.dotes || [])].filter(Boolean);
  const dotes = DOTES.filter((d) => d.custom && ids.includes(d.id));
  pj.personalizado = (tf || es || dotes.length) ? { trasfondo: tf ? crudo(tf) : null, especie: es ? crudo(es) : null, dotes: dotes.map(crudo) } : null;
}
const crudo = (x) => x._crudo || x;

export const nuevoId = (pref) => `x_${pref}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// Convierte lo que se guarda (formulario) al formato que usa el motor
export function normalizar(k, x) {
  if (k === 'trasfondos') return {
    id: x.id, n: x.n, carac: x.carac || [], dote: x.dote || null, habilidades: x.habilidades || [], herramienta: x.herramienta || '',
    d: x.d || '', equipo: { A: [...(x.equipo || '').split('\n').map((s) => s.trim()).filter(Boolean), ...(x.po ? [`po:${x.po}`] : [])], B: [`po:${x.poB || 50}`] },
    custom: true, origen: x.origen, _crudo: x,
  };
  if (k === 'especies') return {
    id: x.id, n: x.n, tam: x.tam?.length ? x.tam : ['Mediano'], vel: Number(x.vel) || 9, resumen: x.d || '', vision: Number(x.vision) || 0,
    pgExtraPorNivel: Number(x.pgExtra) || 0, rasgos: (x.rasgos || []).filter((r) => r.n), custom: true, origen: x.origen, _crudo: x,
    ...(x.habilidadExtra ? { habilidadElegir: { n: 'Habilidad de especie', de: 'todas' } } : {}),
    ...(x.doteOrigenExtra ? { doteOrigenExtra: true } : {}),
  };
  return { id: x.id, n: x.n, tipo: x.tipo || 'origen', d: x.d || '', req: x.req || '', custom: true, origen: x.origen, _crudo: x, ...(x.habilidades ? { habilidades: Number(x.habilidades) } : {}) };
}

registrar(leerPersonal());
