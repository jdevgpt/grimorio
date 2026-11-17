// Utilidades de interfaz
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
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function toast(msg, ms = 2600) {
  const zona = document.getElementById('toasts');
  const t = h('div.toast', {}, msg);
  zona.append(t);
  setTimeout(() => t.classList.add('fuera'), ms);
  setTimeout(() => t.remove(), ms + 400);
}

export function modal(titulo, contenido, botones = [{ t: 'Cerrar' }]) {
  return new Promise((res) => {
    const fondo = h('div.modal-fondo');
    const cerrar = (v) => { fondo.remove(); res(v); };
    const caja = h('div.modal', {},
      h('h2', {}, titulo),
      h('div.modal-cuerpo', {}, contenido),
      h('div.modal-botones', {}, botones.map((b) => h('button.btn' + (b.clase ? '.' + b.clase : ''), { onclick: () => cerrar(b.v ?? b.t) }, b.t))),
    );
    fondo.addEventListener('click', (e) => { if (e.target === fondo) cerrar(null); });
    fondo.append(caja);
    document.body.append(fondo);
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
export const estadoDados = { modo: 'normal', historial: [] };

export function tirarD20(etiqueta, bon) {
  const expr = estadoDados.modo === 'ventaja' ? `2d20kh1${fmt(bon)}` : estadoDados.modo === 'desventaja' ? `2d20kl1${fmt(bon)}` : `1d20${fmt(bon)}`;
  return mostrarTirada(etiqueta, expr);
}

export function mostrarTirada(etiqueta, expr) {
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
