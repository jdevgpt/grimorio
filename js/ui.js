// Utilidades de interfaz

// Unidades: junto a metros, kilos y kilómetros se muestra el equivalente de la edición anterior
// (convención del juego: 1,5 m = 5 pies, 0,5 kg = 1 libra, 1,5 km = 1 milla)
const num = (t) => Number(String(t).replace(',', '.'));
const es = (v) => (Math.round(v * 10) / 10).toString().replace('.', ',');
const pies = (m) => es(num(m) / 1.5 * 5);
export function unidades(texto) {
  if (typeof texto !== 'string' || !/\d\s?(m|kg|km)\b/.test(texto)) return texto;
  return texto
    .replace(/(\d+(?:,\d+)?)\s?km\/h\b(?!\s?\()/g, (_, v) => `${v} km/h (${es(num(v) / 1.5)} millas/h)`)
    .replace(/(\d+(?:,\d+)?)\s?km\b(?![\/\s]?\(|\/h)/g, (_, v) => `${v} km (${es(num(v) / 1.5)} ${num(v) / 1.5 === 1 ? 'milla' : 'millas'})`)
    .replace(/(\d+(?:,\d+)?)\s?kg\b(?!\s?\()/g, (_, v) => `${v} kg (${es(num(v) * 2)} lb)`)
    .replace(/(\d+(?:,\d+)?)\/(\d+(?:,\d+)?)\s?m\b(?!\s?\()/g, (_, a, b) => `${a}/${b} m (${pies(a)}/${pies(b)} pies)`)
    .replace(/(\d+(?:,\d+)?)\s?m\b(?!\s?\()/g, (_, v) => `${v} m (${pies(v)} pies)`);
}
// Texto que no debe tocarse (lo escrito por los jugadores)
export const textoLibre = (t) => document.createTextNode(String(t ?? ''));

import { tirar } from './motor.js';
import { fmt } from './datos/reglas.js';

export function h(tag, attrs = {}, ...hijos) {
  const [t, ...clases] = tag.split('.');
  const el = document.createElement(t || 'div');
  if (clases.length) el.className = clases.join(' ');
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className += (el.className ? ' ' : '') + v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k in el && k !== 'list' && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of hijos.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(unidades(String(c))));
  }
  return el;
}

export function toast(msg, ms = 2600) {
  const zona = document.getElementById('toasts');
  const t = h('div.toast', {}, msg);
  while (zona.children.length >= 2) zona.firstChild.remove();
  zona.append(t);
  setTimeout(() => t.classList.add('fuera'), ms);
  setTimeout(() => t.remove(), ms + 400);
}

// Aviso con un botón de acción (p. ej. «Deshacer»); dura más para dar tiempo a pulsarlo
export function toastAccion(msg, textoBoton, accion, ms = 9000) {
  const zona = document.getElementById('toasts');
  while (zona.children.length >= 2) zona.firstChild.remove();
  const t = h('div.toast.con-accion', {}, h('span', {}, msg),
    h('button', { onclick: () => { t.remove(); accion(); } }, textoBoton));
  zona.append(t);
  setTimeout(() => t.classList.add('fuera'), ms);
  setTimeout(() => t.remove(), ms + 400);
}

export function modal(titulo, contenido, botones = [{ t: 'Cerrar' }], opciones = {}) {
  return new Promise((res) => {
    const fondo = h('div.modal-fondo');
    const cerrar = (v) => { fondo.remove(); res(v); };
    const caja = h('div.modal', {},
      h('h2', {}, titulo),
      h('div.modal-cuerpo', {}, contenido),
      h('div.modal-botones' + (opciones.vertical || botones.length > 2 ? '.vertical' : ''), {}, botones.map((b) => h('button.btn' + (b.clase ? '.' + b.clase : ''), { onclick: () => cerrar('v' in b ? b.v : b.t) }, b.t))),
    );
    fondo.addEventListener('click', (e) => { if (e.target === fondo) cerrar(null); });
    fondo.append(caja);
    document.body.append(fondo);
    opciones.alAbrir?.(cerrar);
  });
}

export const confirmar = (titulo, texto, si = 'Aceptar') => modal(titulo, h('p', {}, texto), [{ t: 'Cancelar', v: false }, { t: si, v: true, clase: 'rojo' }]);

export async function pedirTexto(titulo, etiqueta, valor = '') {
  const inp = h('input', { value: valor, type: 'text' });
  setTimeout(() => inp.focus(), 50);
  const r = await modal(titulo, h('label.campo', {}, etiqueta, inp), [{ t: 'Cancelar', v: false }, { t: 'Aceptar', v: true, clase: 'rojo' }]);
  return r ? inp.value.trim() : null;
}

// Tirada con ventaja/desventaja según el estado global
export const estadoDados = { modo: 'normal', historial: [], fisicos: false };

export function tirarD20(etiqueta, bon) {
  if (estadoDados.fisicos) return avisoFisico(etiqueta, `1d20${fmt(bon)}${estadoDados.modo === 'ventaja' ? ' con ventaja' : estadoDados.modo === 'desventaja' ? ' con desventaja' : ''}`);
  const expr = estadoDados.modo === 'ventaja' ? `2d20kh1${fmt(bon)}` : estadoDados.modo === 'desventaja' ? `2d20kl1${fmt(bon)}` : `1d20${fmt(bon)}`;
  return mostrarTirada(etiqueta, expr);
}

function avisoFisico(etiqueta, expr) {
  const zona = document.getElementById('toasts');
  while (zona.children.length >= 2) zona.firstChild.remove();
  const t = h('div.toast.tirada.fisica', {}, h('span.tir-et', {}, `🎲 ${etiqueta}`), h('strong.tir-total', {}, '🎲'), h('span.tir-det', {}, `Tira en la mesa: ${expr.replace('kh1', '').replace('kl1', '')}`));
  zona.append(t);
  setTimeout(() => t.classList.add('fuera'), 4200);
  setTimeout(() => t.remove(), 4600);
  return null;
}

// Para tiradas cuyo resultado necesita la app: con dados físicos lo pide; con virtuales lo tira
export async function obtenerTirada(etiqueta, expr, ayuda = '') {
  if (!estadoDados.fisicos) return mostrarTirada(etiqueta, expr);
  const inp = h('input.num.grande', { type: 'number', inputmode: 'numeric' });
  setTimeout(() => inp.focus(), 60);
  const ok = await modal(`🎲 ${etiqueta}`, h('div', {}, h('p', {}, `Tira ${expr} en la mesa y escribe el resultado${/[+-]\d/.test(expr) ? ' total (con el bonificador)' : ''}.`), ayuda ? h('p.peq', {}, ayuda) : null, inp),
    [{ t: 'Cancelar', v: false }, { t: 'Aceptar', v: true, clase: 'rojo' }]);
  if (!ok || inp.value === '') return null;
  return { total: Number(inp.value), detalle: 'mesa' };
}

export function mostrarTirada(etiqueta, expr) {
  if (estadoDados.fisicos) return avisoFisico(etiqueta, expr);
  const r = tirar(expr);
  const nat = r.detalle.match(/\[(\d+)(?:, (\d+))?\]/);
  let extra = '';
  if (/d20/.test(expr) && nat) {
    const vals = [Number(nat[1]), nat[2] ? Number(nat[2]) : null].filter((x) => x != null);
    const usado = expr.includes('kh1') ? Math.max(...vals) : expr.includes('kl1') ? Math.min(...vals) : vals[0];
    if (usado === 20) extra = ' · ¡20 natural!'; else if (usado === 1) extra = ' · 1 natural';
  }
  estadoDados.historial.unshift({ etiqueta, expr, ...r, extra, t: Date.now() });
  estadoDados.historial = estadoDados.historial.slice(0, 50);
  const zona = document.getElementById('toasts');
  const t = h('div.toast.tirada', {}, h('span.tir-et', {}, etiqueta), h('strong.tir-total', {}, r.total), h('span.tir-det', {}, `${expr} → ${r.detalle}${extra}`));
  while (zona.children.length >= 2) zona.firstChild.remove();
  zona.append(t);
  setTimeout(() => t.classList.add('fuera'), 4200);
  setTimeout(() => t.remove(), 4600);
  if (navigator.vibrate) try { navigator.vibrate(30); } catch { /* sin vibración */ }
  return r;
}

export function guardarLocal(clave, valor) { try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* almacenamiento no disponible */ } }
export function leerLocal(clave, def) { try { const v = localStorage.getItem(clave); return v ? JSON.parse(v) : def; } catch { return def; } }

export function descargar(nombre, texto, tipo = 'application/json') {
  const a = h('a', { href: URL.createObjectURL(new Blob([texto], { type: tipo })), download: nombre });
  document.body.append(a); a.click(); a.remove();
}

// Limpiezas al cambiar de pantalla (oyentes en tiempo real, temporizadores…)
const limpiezas = [];
export const alSalir = (fn) => limpiezas.push(fn);
export function limpiarPantalla() { while (limpiezas.length) { try { limpiezas.pop()(); } catch { /* */ } } }

// Nombre de archivo para exportar: LSDE_Nombre (sin espacios ni símbolos raros)
export const nombreArchivo = (nombre) => `LSDE_${String(nombre || 'Personaje').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'Personaje'}.json`;
