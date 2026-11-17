// Grimorio: índice de conjuros del SRD 5.2
import n01 from './conjuros/nivel0-1.js';
import n23 from './conjuros/nivel2-3.js';
import n45 from './conjuros/nivel4-5.js';
import n69 from './conjuros/nivel6-9.js';

export const ESCUELAS = { a: 'Abjuración', d: 'Adivinación', c: 'Conjuración', e: 'Encantamiento', v: 'Evocación', i: 'Ilusión', n: 'Nigromancia', t: 'Transmutación' };
export const CLASES_CONJ = { B: 'bardo', C: 'clerigo', D: 'druida', P: 'paladin', E: 'explorador', H: 'hechicero', K: 'brujo', M: 'mago' };
export const LETRA_CLASE = Object.fromEntries(Object.entries(CLASES_CONJ).map(([l, id]) => [id, l]));
export const NOMBRE_CLASE = { B: 'Bardo', C: 'Clérigo', D: 'Druida', P: 'Paladín', E: 'Explorador', H: 'Hechicero', K: 'Brujo', M: 'Mago' };

export const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export const CONJUROS = [...n01, ...n23, ...n45, ...n69]
  .map((s) => ({ ...s, id: norm(s.n).replace(/[^a-z0-9]+/g, '_'), conc: (s.f || '').includes('C'), ritual: (s.f || '').includes('R'), escuela: ESCUELAS[s.e] }))
  .sort((a, b) => a.nv - b.nv || a.n.localeCompare(b.n, 'es'));

const porNombre = new Map(CONJUROS.map((s) => [norm(s.n), s]));
export const conjuroPorNombre = (n) => porNombre.get(norm(n));
export const conjuro = (id) => CONJUROS.find((s) => s.id === id);
export const deClase = (claseId) => CONJUROS.filter((s) => s.cl.includes(LETRA_CLASE[claseId]));
export const nivelTexto = (nv) => (nv === 0 ? 'Truco' : `Nivel ${nv}`);
