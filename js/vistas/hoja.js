// Hoja de personaje viva
import { h, textoLibre, toast, toastAccion, modal, confirmar, tirarD20, mostrarTirada, obtenerTirada, estadoDados, descargar } from '../ui.js';
import { CARACTERISTICAS, HABILIDADES, ESTADOS, AGOTAMIENTO, IDIOMAS_ESTANDAR, IDIOMAS_RAROS, PX, fmt, mod, habilidad } from '../datos/reglas.js';
import { CLASES, clase } from '../datos/clases.js';
import { ESPECIES, especie } from '../datos/especies.js';
import { TRASFONDOS, DOTES, dote } from '../datos/trasfondos.js';
import { ARMAS, ARMADURAS, PROPIEDADES, MAESTRIAS, arma, armadura } from '../datos/equipo.js';
import { calcular, validar, tirar, CAR_IDS, periciasMaximas } from '../motor.js';
import { guardar, borrar, esMio, soyDMde, estado, asignarPartida, reglasDe } from '../almacen.js';
import { asistenteNivel } from './nivel.js';
import { informeValidacion, metros } from './comun.js';
import { conjuroPorNombre, LETRA_CLASE } from '../datos/conjuros.js';
import { fichaConjuro, etiquetasConj, elegirConjuros } from './grimorio.js';

const PESTANAS = [['combate', '⚔ Combate'], ['habilidades', '◎ Habilidades'], ['conjuros', '✧ Conjuros'], ['equipo', '⚖ Equipo'], ['rasgos', '❖ Rasgos'], ['notas', '✎ Notas'], ['revisar', '⚙ Editar y revisar']];
let pestana = 'combate';
let modoDM = false;
const MAX_HISTORIAL = 15;

export function vistaHoja(cont, pjOriginal, irA) {
  const pj = pjOriginal;
  const dm = soyDMde(pj);
  let ro = !esMio(pj) && !(dm && modoDM);
  const cambio = (fn) => (...a) => { if (ro) return; fn(...a); guardar(pj); dibujar(); };
  const cambioH = (desc, fn) => (...a) => { if (ro) return; registrar(desc); fn(...a); guardar(pj); dibujar(); };

  // ---------- Historial para deshacer ----------
  function registrar(desc) {
    const h0 = pj.historial?.[0];
    const quien = estado.usuario?.nombre || pj.jugador || 'Jugador';
    if (h0 && h0.d === desc && h0.quien === quien && Date.now() - h0.t < 180000 && /Edición|Conjuros|Equipo|Rasgos/.test(desc)) return;
    const { historial, ...copia } = pj;
    pj.historial = [{ t: Date.now(), d: desc, quien, dm: !esMio(pj), estado: JSON.parse(JSON.stringify(copia)) }, ...(historial || [])].slice(0, MAX_HISTORIAL);
  }
  const FIJOS = ['id', 'owner', 'ownerNombre', 'lectores', 'partida', 'partidaDm', 'partidaNombre', 'historial'];
  async function restaurar(i) {
    const e = pj.historial[i];
    const ok = await confirmar('Deshacer cambios', `La hoja volverá a como estaba antes de «${e.d}» (${new Date(e.t).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}). Se guarda una copia del estado actual por si quieres rehacerlo.`, 'Deshacer');
    if (!ok) return;
    registrar(`Antes de deshacer «${e.d}»`);
    const fijos = Object.fromEntries(FIJOS.map((k) => [k, pj[k]]));
    for (const k of Object.keys(pj)) if (!FIJOS.includes(k)) delete pj[k];
    Object.assign(pj, JSON.parse(JSON.stringify(e.estado)), fijos);
    guardar(pj, true); dibujar(); toast('Cambios deshechos.');
  }
  let c;

  function dibujar() {
    c = calcular(pj, reglasDe(pj));
    estadoDados.fisicos = c.reglas.dados === 'fisicos';
    const y = scrollY;
    cont.replaceChildren(
      h('div.hoja' + (ro ? '.solo-lectura' : ''), {},
        cabecera(),
        h('nav.pestanas', {}, PESTANAS.filter(([id]) => !(id === 'revisar' && ro && !dm)).map(([id, n]) => h('button' + (pestana === id ? '.sel' : ''), { onclick: () => { pestana = id; dibujar(); } }, n))),
        h('div.pestana-cuerpo', {}, ({ combate, habilidades, conjuros, equipo, rasgos, notas, revisar })[pestana]()),
      ),
    );
    scrollTo(0, y);
  }

  // ---------- Cabecera ----------
  function cabecera() {
    const pct = Math.max(0, Math.min(100, ((pj.pg.actual ?? c.pgMax) / c.pgMax) * 100));
    return h('header.hoja-cab', {},
      h('div.hoja-titulo', {},
        h('div.sello', {}, (pj.nombre || '?')[0].toUpperCase()),
        h('div', {},
          h('h1', {}, pj.nombre || 'Sin nombre'),
          h('p', {}, `${c.es?.n || '—'}${c.lin ? ` (${c.lin.n})` : ''} · ${c.cl?.n || '—'} ${pj.nivel}${pj.nivel >= 3 && c.cl ? ` · ${c.cl.subclase.n}` : ''}`),
          h('p.peq', {}, [c.tf?.n, pj.alineamiento, ro ? `Jugador: ${pj.ownerNombre || pj.jugador || '?'}` : pj.jugador].filter(Boolean).join(' · ')),
        ),
      ),
      h('div.cajas', {},
        caja('CA', c.ca, c.caDesc),
        caja('Inic.', fmt(c.iniciativa), 'Tirar iniciativa', () => tirarD20(`${pj.nombre}: iniciativa`, c.iniciativa)),
        h('div.caja', {}, h('small', {}, 'Vel.'), h('b', {}, textoLibre(metros(c.vel))), h('small.pies', {}, textoLibre(`${Math.round(c.vel / 1.5 * 5)} pies`))),
        caja('Comp.', fmt(c.pb)),
        caja('Perc. pas.', c.percepcionPasiva),
      ),
      h('div.pg', {},
        h('div.pg-barra', {}, h('div', { style: { width: pct + '%' }, class: pct <= 25 ? 'critico' : pct <= 50 ? 'medio' : '' })),
        h('div.pg-fila', {},
          h('button.btn.peq', { onclick: () => pedirPG('dano') }, '− Daño'),
          h('div.pg-num', {}, h('b', {}, pj.pg.actual ?? c.pgMax), ` / ${c.pgMax}`, pj.pg.temp ? h('span.temp', {}, ` +${pj.pg.temp} tmp`) : ''),
          h('button.btn.peq.verde', { onclick: () => pedirPG('cura') }, '+ Curar'),
        ),
      ),
      dm && h('div.aviso-dm', {}, h('span', {}, modoDM ? '✎ Estás corrigiendo esta hoja como DM.' : '👁 Ves la hoja de tu jugador.'),
        h('button.btn.peq' + (modoDM ? '.rojo' : ''), { onclick: () => { modoDM = !modoDM; ro = !esMio(pj) && !(dm && modoDM); dibujar(); } }, modoDM ? 'Terminar corrección' : 'Corregir como DM')),
      !ro && h('div.acciones', {},
        pj.historial?.length ? h('button.btn.peq.deshacer', { onclick: () => restaurar(0), title: `Deshacer: ${pj.historial[0].d}` }, `↶ Deshacer «${pj.historial[0].d.replace('Edición en «Editar y revisar»', 'edición')}»`) : null,
        h('button.btn.peq' + (pj.inspiracion ? '.dorado' : ''), { onclick: cambio(() => { pj.inspiracion = !pj.inspiracion; }), title: 'Inspiración heroica' }, pj.inspiracion ? '★ Inspiración' : '☆ Inspiración'),
        h('button.btn.peq', { onclick: descansoCorto }, '☾ Desc. corto'),
        h('button.btn.peq', { onclick: descansoLargo }, '☀ Desc. largo'),
        pj.nivel < 20 && h('button.btn.peq.rojo', { onclick: subirNivel }, '⬆ Subir nivel'),
      ),
    );
  }

  const caja = (et, v, title, onclick) => h(onclick ? 'button.caja.tirable' : 'div.caja', { title, onclick }, h('small', {}, et), h('b', {}, v));

  async function pedirPG(tipo) {
    if (ro) return;
    const inp = h('input.num', { type: 'number', min: 0, inputmode: 'numeric' });
    const tmp = tipo === 'cura' ? h('label.radio', {}, h('input', { type: 'checkbox' }), ' PG temporales') : null;
    setTimeout(() => inp.focus(), 50);
    const r = await modal(tipo === 'dano' ? 'Recibir daño' : 'Curar', h('div', {}, inp, tmp), [{ t: 'Cancelar', v: false }, { t: 'Aplicar', v: true, clase: 'rojo' }]);
    const n = Number(inp.value);
    if (!r || !n) return;
    let act = pj.pg.actual ?? c.pgMax;
    if (tipo === 'dano') {
      let resto = n;
      if (pj.pg.temp) { const q = Math.min(pj.pg.temp, resto); pj.pg.temp -= q; resto -= q; }
      if (act === 0 && resto > 0) { pj.muerte.ko = Math.min(3, pj.muerte.ko + 1); toast('Daño a 0 PG: un fallo en salvación contra muerte.'); }
      if (resto - act >= c.pgMax) toast('☠ El daño restante iguala o supera tus PG máximos: muerte instantánea.', 5000);
      act = Math.max(0, act - resto);
      if (act === 0) { toast('Caes inconsciente. Haz salvaciones contra muerte.'); if (pj.concentracion) { toast(`Pierdes la concentración en ${pj.concentracion}.`); pj.concentracion = null; } }
      else if (pj.concentracion) {
        const cd = Math.min(30, Math.max(10, Math.floor(n / 2)));
        setTimeout(async () => { const r = estadoDados.fisicos ? await obtenerTirada(`Concentración (CD ${cd})`, `1d20${fmt(c.salvaciones.CON.v)}`, `Salvación de Constitución para mantener ${pj.concentracion}.`) : tirarD20(`Concentración (CD ${cd})`, c.salvaciones.CON.v); if (!r) return; if (r.total < cd) toast(`Fallas: pierdes ${pj.concentracion}. Pulsa «Terminar» si así es.`, 5000); else toast('Mantienes la concentración.'); }, 200);
      }
    } else if (tmp.querySelector('input').checked) {
      pj.pg.temp = Math.max(pj.pg.temp || 0, n);
    } else {
      if (act === 0) pj.muerte = { ok: 0, ko: 0 };
      act = Math.min(c.pgMax, act + n);
    }
    pj.pg.actual = act;
    guardar(pj); dibujar();
  }

  // ---------- Combate ----------
  function combate() {
    return [
      concentracionAviso(),
      h('h3', {}, 'Características'),
      h('div.carac-grid', {}, CARACTERISTICAS.map((k) => h('button.carac.tirable', { onclick: () => tirarD20(`${k.n}`, c.mod[k.id]) },
        h('small', {}, k.n), h('b', {}, fmt(c.mod[k.id])), h('span', {}, c.car[k.id])))),
      h('h3', {}, 'Tiradas de salvación'),
      h('div.salv-grid', {}, CARACTERISTICAS.map((k) => h('button.salv.tirable' + (c.salvaciones[k.id].comp ? '.comp' : ''), { onclick: () => tirarD20(`Salvación de ${k.n}`, c.salvaciones[k.id].v) },
        h('span.marca', {}, c.salvaciones[k.id].comp ? '●' : '○'), k.id, h('b', {}, fmt(c.salvaciones[k.id].v))))),
      h('h3', {}, 'Ataques'),
      h('div.ataques', {}, c.ataques.map((a) => h('div.ataque', {},
        h('div.ataque-cab', {}, h('b', {}, a.n), a.arma && h('small.props', {}, [a.arma.rango ? `${a.arma.rango} m` : '', ...a.arma.prop.map((p) => PROPIEDADES[p].split(':')[0]), `Maestría: ${MAESTRIAS[a.arma.m].split(':')[0]}`].filter(Boolean).join(' · '), !a.comp ? ' · sin competencia' : '')),
        h('div.ataque-botones', {},
          h('button.btn-ataque', { onclick: () => { tirarD20(`${a.n}: ataque`, a.bon); gastarMunicion(a); } }, h('small', {}, '🎯 Ataque'), h('b', {}, fmt(a.bon))),
          h('button.btn-dano', { onclick: () => mostrarTirada(`${a.n}: daño`, a.dano) }, h('small', {}, `⚔ Daño${a.vers ? ' (1 mano)' : ''}`), h('b', {}, a.dano), h('small', {}, a.td.toLowerCase())),
          a.vers && h('button.btn-dano', { onclick: () => mostrarTirada(`${a.n}: daño (2 manos)`, a.vers) }, h('small', {}, '⚔ Daño (2 manos)'), h('b', {}, a.vers), h('small', {}, a.td.toLowerCase())),
        ),
      ))),
      h('p.ayuda', {}, 'Toca para tirar. Modo de tirada: ', modoDados()),
      c.recursos.length ? [h('h3', {}, 'Recursos'), h('div.recursos', {}, c.recursos.map(recurso))] : null,
      h('h3', {}, 'Dados de golpe'),
      h('div.recurso', {}, h('span', {}, `${c.dadoGolpe} · disponibles ${pj.nivel - (pj.dadosGolpeGastados || 0)} / ${pj.nivel}`),
        !ro && h('button.btn.peq', { onclick: gastarDadoGolpe, disabled: pj.dadosGolpeGastados >= pj.nivel }, 'Gastar uno')),
      (pj.pg.actual === 0) && h('div.muerte', {}, h('h3', {}, 'Salvaciones contra muerte'),
        h('div', {}, 'Éxitos ', marcas(pj.muerte.ok, 3, (n) => { pj.muerte.ok = n; }), ' Fallos ', marcas(pj.muerte.ko, 3, (n) => { pj.muerte.ko = n; })),
        !ro && h('button.btn.peq', { onclick: salvacionMuerte }, estadoDados.fisicos ? '🎲 Anotar salvación' : '🎲 Tirar salvación')),
      h('h3', {}, 'Estados'),
      h('div.chips', {}, ESTADOS.map((e) => h('button.chip' + (pj.estados.includes(e.id) ? '.sel.rojo' : ''), { title: e.d, onclick: cambio(() => { pj.estados = pj.estados.includes(e.id) ? pj.estados.filter((x) => x !== e.id) : [...pj.estados, e.id]; }) }, e.n))),
      pj.estados.length ? h('ul.lista-estados', {}, pj.estados.map((id) => { const e = ESTADOS.find((x) => x.id === id); return h('li', {}, h('b', {}, e.n + ': '), e.d); })) : null,
      h('div.agotamiento', {}, h('b', {}, 'Agotamiento: '), marcas(pj.agotamiento || 0, 6, (n) => { pj.agotamiento = n; }), pj.agotamiento ? h('p.peq', {}, `−${pj.agotamiento * 2} a las pruebas de d20, −${metros(pj.agotamiento * 1.5)} de velocidad. ${AGOTAMIENTO}`) : null),
    ];
  }

  function gastarMunicion(a) {
    if (ro || !c.reglas.municion || !a.arma?.prop.includes('municion')) return;
    const tipo = /arco/i.test(a.arma.n) ? /flecha/i : /ballesta/i.test(a.arma.n) ? /virote/i : /cerbatana/i.test(a.arma.n) ? /aguja|dardo de cerbatana/i : /bala|munici[oó]n/i;
    const it = pj.equipo.find((e) => tipo.test(e.n) && Number(e.c) > 0);
    if (!it) { toast(`⚠ No te queda munición para ${a.arma.n}. Añádela en Equipo.`, 4000); return; }
    it.c = Number(it.c) - 1; guardar(pj);
    setTimeout(() => toast(`${it.n}: te quedan ${it.c}. Tras el combate recuperas la mitad.`), 300);
    dibujar();
  }

  function modoDados() {
    return h('span.segmentado.mini', {}, [['desventaja', 'Desv.'], ['normal', 'Normal'], ['ventaja', 'Vent.']].map(([m, t]) => h('button' + (estadoDados.modo === m ? '.sel' : ''), { onclick: () => { estadoDados.modo = m; dibujar(); } }, t)));
  }

  function marcas(n, max, set) {
    return h('span.marcas', {}, Array.from({ length: max }, (_, i) => h('button.marca' + (i < n ? '.llena' : ''), { onclick: cambio(() => set(i < n && i === n - 1 ? i : i + 1)) }, i < n ? '●' : '○')));
  }

  function recurso(r) {
    if (!r.max) return h('div.recurso', {}, h('span', {}, h('b', {}, r.n)), h('span.nota', {}, r.nota || ''));
    const usados = Math.min(r.max, pj.recursos[r.id] || 0);
    const quedan = r.max - usados;
    return h('div.recurso', {},
      h('span', {}, h('b', {}, r.n), r.nota ? h('span.nota', {}, ` ${r.nota}`) : '', h('small', {}, ` (${r.rec === 'corto' ? 'desc. corto' : 'desc. largo'})`)),
      r.max <= 8 ? marcas(quedan, r.max, (n) => { pj.recursos[r.id] = r.max - n; })
        : h('span.contador', {}, h('button', { onclick: cambio(() => { pj.recursos[r.id] = Math.min(r.max, usados + 1); }) }, '−'), h('b', {}, `${quedan}/${r.max}`), h('button', { onclick: cambio(() => { pj.recursos[r.id] = Math.max(0, usados - 1); }) }, '+')),
    );
  }

  async function gastarDadoGolpe() {
    if (ro || pj.dadosGolpeGastados >= pj.nivel) return;
    const r = await obtenerTirada('Dado de golpe', `1d${c.cl.dg}${fmt(c.mod.CON)}`);
    if (!r) return;
    pj.dadosGolpeGastados = (pj.dadosGolpeGastados || 0) + 1;
    pj.pg.actual = Math.min(c.pgMax, (pj.pg.actual ?? c.pgMax) + Math.max(0, r.total));
    guardar(pj); dibujar();
  }

  async function salvacionMuerte() {
    const r = estadoDados.fisicos ? await obtenerTirada('Salvación contra muerte', '1d20', 'Escribe lo que sale en el dado, sin sumar nada.') : tirar('1d20');
    if (!r) return;
    if (r.total === 20) { pj.pg.actual = 1; pj.muerte = { ok: 0, ko: 0 }; toast('¡20 natural! Recuperas 1 PG.'); }
    else if (r.total === 1) { pj.muerte.ko = Math.min(3, pj.muerte.ko + 2); toast('1 natural: dos fallos.'); }
    else if (r.total >= 10) { pj.muerte.ok++; toast(`${r.total}: éxito.`); }
    else { pj.muerte.ko++; toast(`${r.total}: fallo.`); }
    if (pj.muerte.ok >= 3) { toast('Te estabilizas.'); pj.muerte = { ok: 0, ko: 0 }; }
    if (pj.muerte.ko >= 3) toast('☠ Tres fallos: el personaje muere.', 5000);
    guardar(pj); dibujar();
  }

  async function descansoCorto() {
    const dur = { estandar: '1 hora', heroico: '5 minutos', realista: '8 horas' }[c.reglas.descansos];
    const ok = await confirmar(`Descanso corto (${dur})`, 'Recuperas los recursos de descanso corto (y los espacios de pacto). Puedes gastar dados de golpe desde Combate.', 'Descansar');
    if (!ok) return;
    registrar('Descanso corto');
    for (const r of c.recursos) if (r.rec === 'corto') pj.recursos[r.id] = 0;
    pj.pactoGastados = 0;
    guardar(pj); pestana = 'combate'; dibujar(); toastAccion('Descanso corto completado.', '↶ Deshacer', () => restaurar(0));
  }

  async function descansoLargo() {
    const dur = { estandar: '8 horas', heroico: '1 hora', realista: '7 días' }[c.reglas.descansos];
    const ok = await confirmar(`Descanso largo (${dur})`, 'Recuperas todos los PG, los dados de golpe, los espacios de conjuro y los recursos. Pierdes 1 nivel de agotamiento.', 'Descansar');
    if (!ok) return;
    registrar('Descanso largo');
    pj.pg.actual = c.pgMax; pj.pg.temp = 0; pj.dadosGolpeGastados = 0;
    pj.recursos = {}; pj.espaciosGastados = {}; pj.pactoGastados = 0;
    pj.agotamiento = Math.max(0, (pj.agotamiento || 0) - 1); pj.muerte = { ok: 0, ko: 0 }; pj.concentracion = null;
    if (pj.especie === 'humano') pj.inspiracion = true;
    guardar(pj); dibujar(); toastAccion('Descanso largo completado.', '↶ Deshacer', () => restaurar(0));
  }

  async function subirNivel() {
    if (!c.cl) return toast('Primero elige una clase en «Editar y revisar».');
    const aplicar = await asistenteNivel(pj, c.reglas);
    if (!aplicar) return;
    registrar(`Subida a nivel ${pj.nivel + 1}`);
    const antes = c.pgMax;
    aplicar(pj);
    const despues = calcular(pj, reglasDe(pj)).pgMax;
    pj.pg.actual = (pj.pg.actual ?? antes) + (despues - antes);
    guardar(pj, true); dibujar(); toastAccion(`¡Nivel ${pj.nivel}!`, '↶ Deshacer', () => restaurar(0));
  }

  // ---------- Habilidades ----------
  function habilidades() {
    return [
      h('div.lista-hab-hoja', {}, c.habilidades.map((x) => h('button.hab-hoja.tirable' + (x.nivel ? '.comp' : ''), { onclick: () => tirarD20(x.n, x.v) },
        h('span.marca', {}, x.nivel === 2 ? '◆' : x.nivel === 1 ? '●' : '○'), h('span', {}, x.n, h('small', {}, ` ${x.c}`)), h('b', {}, fmt(x.v))))),
      h('p.ayuda', {}, '● competente · ◆ pericia. Toca para tirar. Modo: ', modoDados()),
      h('div.datos-extra', {},
        h('p', {}, h('b', {}, 'Percepción pasiva: '), c.percepcionPasiva),
        c.vision ? h('p', {}, h('b', {}, 'Visión en la oscuridad: '), metros(c.vision)) : null,
        h('p', {}, h('b', {}, 'Idiomas: '), (pj.idiomas || []).join(', ') || '—'),
        h('p', {}, h('b', {}, 'Herramientas: '), (pj.herramientas || []).join(', ') || '—'),
        c.cl && h('p', {}, h('b', {}, 'Armas: '), c.cl.armas.join(', ').replace('marciales_ligeras', 'marciales ligeras').replace('marciales_sutil_ligera', 'marciales sutiles o ligeras')),
        c.cl && h('p', {}, h('b', {}, 'Armaduras: '), c.cl.armad.join(', ') || 'ninguna'),
      ),
    ];
  }

  // ---------- Conjuros ----------
  function conjuros() {
    const m = c.magia;
    const lista = [...(pj.conjuros || [])].map((s, i) => ({ ...s, i, g: conjuroPorNombre(s.n) })).sort((a, b) => a.nv - b.nv || a.n.localeCompare(b.n, 'es'));
    const porNivel = {};
    lista.forEach((s) => { (porNivel[s.nv] ||= []).push(s); });
    const nPrep = lista.filter((s) => s.nv > 0 && s.prep && !s.siempre && !s.extra).length;
    const nTrucos = lista.filter((s) => s.nv === 0 && !s.extra).length;
    const maxNv = m ? (m.pacto ? m.pacto.nivel : m.espacios.length) : 0;
    return [
      concentracionAviso(),
      m ? h('div.cajas', {},
        caja('Caract.', m.car), caja('CD', m.cd),
        caja('Ataque', fmt(m.ataque), 'Tirar ataque de conjuro', () => tirarD20('Ataque de conjuro', m.ataque)),
        m.tipo !== 'innata' && caja('Trucos', `${nTrucos}/${m.trucos}`), m.tipo !== 'innata' && caja('Preparados', `${nPrep}/${m.preparados}`),
      ) : h('p.ayuda', {}, 'Tu personaje no lanza conjuros de clase. Puedes anotar aquí conjuros de rasgos u objetos.'),
      m?.espacios?.length ? [h('h3', {}, 'Espacios de conjuro'), h('div.espacios', {}, m.espacios.map((n, i) => {
        const g = pj.espaciosGastados[i + 1] || 0;
        return h('div.espacio', {}, h('small', {}, `Nv ${i + 1}`), marcas(n - g, n, (q) => { pj.espaciosGastados[i + 1] = n - q; }));
      }))] : null,
      m?.pacto ? [h('h3', {}, `Espacios de pacto (nivel ${m.pacto.nivel})`), h('div.espacio', {}, marcas(m.pacto.n - (pj.pactoGastados || 0), m.pacto.n, (q) => { pj.pactoGastados = m.pacto.n - q; })), h('p.peq', {}, 'Se recuperan con un descanso corto o largo.')] : null,
      h('h3', {}, 'Mis conjuros'),
      !ro && h('div.acciones', {},
        h('button.btn.rojo', { onclick: async () => {
          const nuevos = await elegirConjuros({ claseId: pj.clase, maxNv: m && m.tipo !== 'innata' ? maxNv : null, yaTiene: new Set(lista.map((s) => s.g?.id).filter(Boolean)) });
          if (!nuevos.length) return;
          registrar('Conjuros');
          for (const s of nuevos) pj.conjuros.push({ n: s.n, nv: s.nv, prep: true });
          guardar(pj); dibujar(); toast(`${nuevos.length} conjuro(s) añadidos`);
        } }, '✧ Añadir del grimorio')),
      Object.keys(porNivel).length ? Object.entries(porNivel).map(([nv, ss]) => h('div.grupo-conj', {},
        h('h4', {}, nv === '0' ? 'Trucos' : `Nivel ${nv}`),
        ss.map((s) => h('details.conjuro', {},
          h('summary', {},
            s.nv > 0 && !s.siempre ? h('input', { type: 'checkbox', checked: !!s.prep, title: 'Preparado', onclick: (e) => e.stopPropagation(), onchange: cambio((e) => { pj.conjuros[s.i].prep = e.target.checked; }) }) : h('span.marca', {}, '✦'),
            h('span.conj-n', {}, h('b', {}, s.n), ' ', s.g ? etiquetasConj(s.g) : null, s.fuente ? h('small', {}, ` · ${s.fuente}`) : '', s.g && !s.extra && m && pj.clase && !s.g.cl.includes(LETRA_CLASE[pj.clase]) ? h('small.mal', {}, ' · fuera de tu lista') : null),
            !ro && h('button.btn.peq.lanzar', { onclick: (e) => { e.preventDefault(); lanzar(s); } }, 'Lanzar'),
          ),
          s.g ? fichaConjuro(s.g) : h('p.peq', {}, s.notas || 'Conjuro anotado a mano.'),
          !ro && h('button.x', { onclick: cambioH('Conjuros', () => { pj.conjuros.splice(s.i, 1); }) }, '× quitar'),
        )),
      )) : h('p.peq', {}, 'Aún no hay conjuros. Añádelos desde el grimorio.'),
      !ro && h('details', {}, h('summary.peq', {}, 'Anotar un conjuro a mano'), formConjuro()),
    ];
  }

  function concentracionAviso() {
    if (!pj.concentracion) return null;
    return h('div.concentracion', {}, h('span', {}, '◉ Concentrado en ', h('b', {}, pj.concentracion)),
      !ro && h('button.btn.peq', { onclick: cambio(() => { pj.concentracion = null; }) }, 'Terminar'));
  }

  async function lanzar(s) {
    const g = s.g; const m = c.magia;
    let nivelEspacio = 0;
    if (s.nv > 0) {
      const opciones = [];
      if (m?.pacto && m.pacto.nivel >= s.nv && (pj.pactoGastados || 0) < m.pacto.n) opciones.push({ t: `Espacio de pacto (nv ${m.pacto.nivel})`, v: 'p' });
      (m?.espacios || []).forEach((n, i) => { const nv = i + 1; if (nv >= s.nv && (pj.espaciosGastados[nv] || 0) < n) opciones.push({ t: `Nivel ${nv} (${n - (pj.espaciosGastados[nv] || 0)} libres)`, v: nv }); });
      const botones = [...opciones.map((o) => ({ ...o, clase: 'rojo' })), { t: 'Sin gastar espacio', v: 0 }, { t: 'Cancelar', v: null }];
      const r = await modal(`Lanzar ${s.n}`, h('div', {},
        g && h('p.peq', {}, `${g.t} · ${g.a} · ${g.conc ? 'Concentración' : g.du}`),
        h('p', {}, opciones.length ? '¿Con qué espacio?' : 'No te quedan espacios del nivel necesario.'),
        h('p.peq', {}, '«Sin gastar espacio»: rituales, rasgos que lo permiten o usos gratuitos.')), botones);
      if (r === null || r === undefined) return;
      if (r === 'p') { pj.pactoGastados = (pj.pactoGastados || 0) + 1; nivelEspacio = m.pacto.nivel; }
      else if (r > 0) { pj.espaciosGastados[r] = (pj.espaciosGastados[r] || 0) + 1; nivelEspacio = r; }
    }
    if (g?.conc) {
      if (pj.concentracion && pj.concentracion !== s.n) toast(`Dejas de concentrarte en ${pj.concentracion}.`);
      pj.concentracion = s.n;
    }
    guardar(pj); dibujar();
    if (g?.x) {
      const expr = escalarTirada(g, nivelEspacio);
      const curacion = /curaci|recupera/i.test(g.d) && !/necr|fuego|radiante|ácido/i.test(g.d.split('.')[0]);
      setTimeout(() => mostrarTirada(`${s.n}${nivelEspacio > s.nv ? ` (nv ${nivelEspacio})` : ''}${curacion ? ': curación' : ''}`, expr), 150);
    } else toast(`Lanzas ${s.n}.`);
  }

  // Ajusta los dados del conjuro al nivel del espacio o del personaje (trucos)
  function escalarTirada(g, nivelEspacio) {
    let expr = g.x;
    const dado = g.x.match(/^(\d+)d(\d+)/);
    if (!dado) return expr;
    let n = Number(dado[1]);
    if (g.nv === 0) {
      const tramo = pj.nivel >= 17 ? 3 : pj.nivel >= 11 ? 2 : pj.nivel >= 5 ? 1 : 0;
      if (/sube|Daño \d|Dado/.test(g.s || '')) n += tramo;
    } else if (nivelEspacio > g.nv && g.s) {
      const extra = (g.s.match(/^\+(\d+)d\d+ por nivel/) || [])[1];
      if (extra) n += Number(extra) * (nivelEspacio - g.nv);
    }
    expr = expr.replace(/^\d+d/, `${n}d`);
    const sumaMod = /modificador de lanzamiento/.test(g.d) && c.magia ? c.mod[c.magia.car] : 0;
    return sumaMod ? `${expr}${fmt(sumaMod)}` : expr;
  }

  function formConjuro() {
    const n = h('input', { placeholder: 'Nombre del conjuro' });
    const nv = h('select', {}, Array.from({ length: 10 }, (_, i) => h('option', { value: i }, i === 0 ? 'Truco' : `Nivel ${i}`)));
    const notas = h('input', { placeholder: 'Notas (opcional)' });
    return h('div.form-linea', {}, n, nv, notas, h('button.btn.peq.rojo', { onclick: cambio(() => { if (!n.value.trim()) return; pj.conjuros.push({ n: n.value.trim(), nv: Number(nv.value), prep: true, notas: notas.value.trim() }); }) }, 'Añadir'));
  }

  // ---------- Equipo ----------
  function equipo() {
    const k = c.carga;
    const kg = (v) => `${Number(v).toFixed(1).replace('.', ',')} kg`;
    return [
      k.activa ? h('div.carga' + (k.estado !== 'normal' ? '.mal' : ''), {},
        h('div.carga-fila', {}, h('b', {}, 'Carga: '), `${kg(k.peso)} / ${kg(k.modo === 'variante' ? k.umbral1 : k.capacidad)}`, h('span.carga-estado', {}, k.estado === 'normal' ? 'Sin penalización' : k.estado)),
        h('div.pg-barra', {}, h('div', { style: { width: Math.min(100, (k.peso / (k.modo === 'variante' ? k.umbral2 : k.capacidad)) * 100) + '%' }, class: k.estado === 'normal' ? '' : k.estado === 'cargado' ? 'medio' : 'critico' })),
        h('p.peq', {}, k.modo === 'variante' ? `Cargado a partir de ${kg(k.umbral1)} (−3 m) · Muy cargado a partir de ${kg(k.umbral2)} (−6 m y desventaja en FUE, DES y CON)` : `Capacidad: ${kg(k.capacidad)}. Si la superas, tu velocidad baja a 1,5 m.`),
      ) : null,
      h('h3', {}, 'Monedas'),
      h('div.monedas', {}, [['pc', 'Cobre'], ['pp', 'Plata'], ['pe', 'Electro'], ['po', 'Oro'], ['ppt', 'Platino']].map(([k, n]) => h('label', {}, h('small', {}, n),
        h('input.num', { type: 'number', value: pj.monedas[k] || 0, disabled: ro, onchange: cambio((e) => { pj.monedas[k] = Number(e.target.value) || 0; }) })))),
      h('h3', {}, 'Inventario'),
      h('div.inventario', {}, (pj.equipo || []).map((e, i) => h('div.item', {},
        e.ref ? h('input', { type: 'checkbox', checked: !!e.equipado, title: 'Equipado', onchange: cambio((ev) => { equipar(i, ev.target.checked); }) }) : h('span.marca', {}, '·'),
        h('span.item-n', {}, e.n, e.ref && h('small', {}, ' ', detalleRef(e.ref))),
        h('input.num.cant', { type: 'number', min: 0, value: e.c ?? 1, disabled: ro, title: 'Cantidad', onchange: cambio((ev) => { pj.equipo[i].c = Number(ev.target.value); }) }),
        k.activa && h('input.num.kg', { type: 'number', min: 0, step: 0.1, value: e.kg ?? k.pesoItem(e), disabled: ro, title: 'Peso por unidad (kg)', onchange: cambio((ev) => { pj.equipo[i].kg = ev.target.value === '' ? null : Number(ev.target.value); }) }),
        !ro && h('button.x', { onclick: cambioH('Equipo', () => { pj.equipo.splice(i, 1); }) }, '×'),
      ))),
      k.activa ? h('p.peq', {}, 'Columnas: cantidad · peso por unidad (kg). Ajusta el peso si no coincide.') : h('p.peq', {}, `Peso total aproximado: ${kg(k.peso)}`),
      !ro && formItem(),
    ];
  }

  function detalleRef(ref) {
    if (ref.startsWith('w:')) { const a = arma(ref.slice(2)); return `${a.dano} ${a.td.toLowerCase()}`; }
    const a = armadura(ref.slice(2)); return a.tipo === 'escudo' ? '+2 CA' : `CA ${a.base}${a.dex === true ? ' + Des' : a.dex ? ' + Des (máx. 2)' : ''}`;
  }

  function equipar(i, on) {
    const e = pj.equipo[i];
    if (on && e.ref.startsWith('a:')) {
      const tipo = armadura(e.ref.slice(2)).tipo;
      pj.equipo.forEach((o) => { if (o.ref?.startsWith('a:') && o.equipado && ((armadura(o.ref.slice(2)).tipo === 'escudo') === (tipo === 'escudo'))) o.equipado = false; });
    }
    e.equipado = on;
  }

  function formItem() {
    const sel = h('select', {}, h('option', { value: '' }, 'Objeto libre…'),
      h('optgroup', { label: 'Armas' }, ARMAS.map((a) => h('option', { value: 'w:' + a.id }, a.n))),
      h('optgroup', { label: 'Armaduras' }, ARMADURAS.map((a) => h('option', { value: 'a:' + a.id }, a.n))));
    const n = h('input', { placeholder: 'Nombre (objeto libre)' });
    const cant = h('input.num', { type: 'number', value: 1, min: 1 });
    return h('div.form-linea', {}, sel, n, cant, h('button.btn.peq.rojo', { onclick: cambioH('Equipo', () => {
      const ref = sel.value || null;
      const nombre = n.value.trim() || (ref ? (ref.startsWith('w:') ? arma(ref.slice(2)).n : armadura(ref.slice(2)).n) : '');
      if (!nombre) return;
      pj.equipo.push({ n: nombre, c: Number(cant.value) || 1, ref, equipado: false });
    }) }, 'Añadir'));
  }

  // ---------- Rasgos ----------
  function rasgos() {
    const grupos = {};
    c.rasgos.forEach((r) => { (grupos[r.fuente] ||= []).push(r); });
    return [
      Object.entries(grupos).map(([f, rs]) => h('div.grupo-rasgos', {}, h('h3', {}, f), rs.map((r) => h('details.rasgo', {}, h('summary', {}, r.n, r.nv ? h('small', {}, ` nv ${r.nv}`) : ''), h('p', {}, r.d))))),
      !ro && h('div', {}, h('h3', {}, 'Añadir rasgo u objeto mágico'), (() => {
        const n = h('input', { placeholder: 'Nombre' }); const d = h('textarea', { placeholder: 'Descripción', rows: 2 });
        return h('div.form-col', {}, n, d, h('button.btn.peq.rojo', { onclick: cambio(() => { if (n.value.trim()) pj.rasgosExtra.push({ n: n.value.trim(), d: d.value.trim() }); }) }, 'Añadir'));
      })()),
      pj.rasgosExtra?.length && !ro ? h('div', {}, h('h4', {}, 'Rasgos personales'), pj.rasgosExtra.map((r, i) => h('div.item', {}, h('span.item-n', {}, r.n), h('button.x', { onclick: cambio(() => { pj.rasgosExtra.splice(i, 1); }) }, '×')))) : null,
    ];
  }

  // ---------- Notas ----------
  function notas() {
    const ta = (k, et, filas = 4) => h('label.campo', {}, h('span', {}, et), h('textarea', { rows: filas, disabled: ro, value: pj[k] || '', onchange: cambio((e) => { pj[k] = e.target.value; }) }));
    return [ta('apariencia', 'Apariencia y personalidad'), ta('historia', 'Historia'), ta('notas', 'Notas de campaña', 8),
      c.reglas.experiencia === 'hitos' ? h('p.peq', {}, 'Progresión por hitos: tu DM decide cuándo subes de nivel.') : h('label.campo', {}, h('span', {}, 'Experiencia (PX)'), h('input.num', { type: 'number', value: pj.px || 0, disabled: ro, onchange: cambio((e) => { pj.px = Number(e.target.value) || 0; }) })),
      pj.px && c.reglas.experiencia !== 'hitos' ? h('p.peq', {}, `Siguiente nivel: ${PX[pj.nivel] ?? '—'} PX`) : null,
    ];
  }

  // ---------- Editar y revisar ----------
  function revisar() {
    const cambioRev = (fn) => cambioH('Edición en «Editar y revisar»', fn);
    const cl = clase(pj.clase); const es = especie(pj.especie);
    const sel = (valor, opciones, set) => h('select', { onchange: cambioRev((e) => set(e.target.value || null)) }, h('option', { value: '' }, '—'), opciones.map(([v, n]) => h('option', { value: v, selected: valor === v }, n)));
    const num = (valor, set, attrs = {}) => h('input.num', { type: 'number', value: valor ?? '', ...attrs, onchange: cambioRev((e) => set(e.target.value === '' ? null : Number(e.target.value))) });
    const maxPer = periciasMaximas(pj);
    return [
      historialUI(),
      h('h3', {}, 'Comprobación de reglas'),
      informeValidacion(validar(pj, reglasDe(pj))),
      h('h3', {}, 'Identidad'),
      h('div.form-grid', {},
        campo('Nombre', h('input', { value: pj.nombre, onchange: cambioRev((e) => { pj.nombre = e.target.value; }) })),
        campo('Jugador', h('input', { value: pj.jugador || '', onchange: cambioRev((e) => { pj.jugador = e.target.value; }) })),
        campo('Nivel', num(pj.nivel, (v) => { pj.nivel = Math.max(1, Math.min(20, v || 1)); }, { min: 1, max: 20 })),
        campo('Clase', sel(pj.clase, CLASES.map((x) => [x.id, x.n]), (v) => { pj.clase = v; pj.eleccion1 = null; })),
        cl?.eleccion1 && campo(cl.eleccion1.n, sel(pj.eleccion1, cl.eleccion1.lista.map((o) => [o.id, o.n]), (v) => { pj.eleccion1 = v; })),
        campo('Especie', sel(pj.especie, ESPECIES.map((x) => [x.id, x.n]), (v) => { pj.especie = v; pj.opcion = null; })),
        es?.opciones && campo(es.opciones.n, sel(pj.opcion, es.opciones.lista.map((o) => [o.id, o.n]), (v) => { pj.opcion = v; })),
        es?.caracConj && campo('Caract. conjuros de especie', sel(pj.caracConj, [['INT', 'INT'], ['SAB', 'SAB'], ['CAR', 'CAR']], (v) => { pj.caracConj = v; })),
        campo('Trasfondo', sel(pj.trasfondo, TRASFONDOS.map((x) => [x.id, x.n]), (v) => { pj.trasfondo = v; })),
      ),
      h('h3', {}, 'Características'),
      campo('Método de las puntuaciones base', sel(pj.metodo, [['estandar', 'Conjunto estándar'], ['puntos', 'Compra de puntos'], ['tirada', 'Tiradas'], ['manual', 'Introducidas a mano']], (v) => { pj.metodo = v || 'manual'; })),
      h('table.tabla-carac', {},
        h('tr', {}, h('th', {}, ''), h('th', {}, 'Base'), h('th', {}, 'Trasf.'), h('th', {}, 'Mejoras'), h('th', {}, 'Ajuste'), h('th', {}, 'Total')),
        CAR_IDS.map((k) => h('tr', {}, h('th', {}, k),
          h('td', {}, num(pj.base[k], (v) => { pj.base[k] = v ?? 10; })),
          h('td', {}, num(pj.bonTrasfondo[k] || 0, (v) => { pj.bonTrasfondo[k] = v || 0; }, { min: 0, max: 2 })),
          h('td', {}, num(pj.mejoras[k] || 0, (v) => { pj.mejoras[k] = v || 0; }, { min: 0 })),
          h('td', {}, num(pj.ajustes?.[k] || 0, (v) => { pj.ajustes[k] = v || 0; })),
          h('td.c.grande', {}, c.car[k]))),
      ),
      h('p.peq', {}, 'Ajuste: objetos mágicos u otros efectos fuera de las reglas de creación.'),
      h('h3', {}, 'Dotes'),
      h('div.chips', {}, DOTES.filter((d) => d.id !== 'mejora_caracteristica').map((d) => h('button.chip' + (pj.dotes.includes(d.id) ? '.sel' : ''), { onclick: cambioRev(() => { pj.dotes = pj.dotes.includes(d.id) ? pj.dotes.filter((x) => x !== d.id) : [...pj.dotes, d.id]; }) }, d.n))),
      c.tf && h('p.peq', {}, `La dote del trasfondo (${dote(c.tf.dote).n}) se aplica sola.`),
      h('h3', {}, 'Habilidades'),
      h('p.ayuda', {}, maxPer ? 'Toca: ninguna → competente → pericia → ninguna.' : 'Toca para marcar o desmarcar la competencia.'),
      h('div.lista-hab', {}, HABILIDADES.map((x) => {
        const v = pj.habilidades[x.id] || 0;
        return h('button.hab' + (v === 1 ? '.comp' : v === 2 ? '.pericia' : ''), { onclick: cambioRev(() => { const s = v === 0 ? 1 : v === 1 && maxPer ? 2 : 0; if (s) pj.habilidades[x.id] = s; else delete pj.habilidades[x.id]; }) },
          h('span.marca', {}, v === 2 ? '◆' : v === 1 ? '●' : '○'), x.n, h('small', {}, x.c));
      })),
      h('h3', {}, 'Combate'),
      h('div.form-grid', {},
        campo(`PG máximos (calculado: ${c.pgCalc})`, num(pj.pg.maxManual, (v) => { pj.pg.maxManual = v; }, { placeholder: c.pgCalc })),
        campo(`CA anotada (calculada: ${c.caCalculada})`, num(pj.ca.manual, (v) => { pj.ca.manual = v; }, { placeholder: c.caCalculada })),
        campo('Bonificador extra a la CA', num(pj.ca.extra || 0, (v) => { pj.ca.extra = v || 0; })),
      ),
      h('p.peq', {}, 'Deja en blanco PG y CA para que se calculen solos. Si los rellenas, la revisión comprobará que sean posibles.'),
      h('h3', {}, 'Idiomas'),
      h('div.chips', {}, [...IDIOMAS_ESTANDAR, ...IDIOMAS_RAROS].map((i) => h('button.chip' + (pj.idiomas.includes(i) ? '.sel' : ''), { onclick: cambioRev(() => { pj.idiomas = pj.idiomas.includes(i) ? pj.idiomas.filter((x) => x !== i) : [...pj.idiomas, i]; }) }, i))),
      campo('Herramientas (separadas por comas)', h('input', { value: (pj.herramientas || []).join(', '), onchange: cambioRev((e) => { pj.herramientas = e.target.value.split(',').map((s) => s.trim()).filter(Boolean); }) })),
      h('h3', {}, 'Partida y copia de seguridad'),
      esMio(pj) ? partidaSelector() : null,
      h('div.acciones', {},
        h('button.btn', { onclick: () => descargar(`${(pj.nombre || 'personaje').replace(/\W+/g, '_')}.json`, JSON.stringify(pj, null, 2)) }, '⬇ Exportar JSON'),
        h('button.btn', { onclick: () => window.print() }, '🖶 Imprimir'),
        esMio(pj) && h('button.btn.rojo', { onclick: async () => { if (await confirmar('Borrar personaje', `¿Seguro que quieres borrar a ${pj.nombre || 'este personaje'}? No se puede deshacer.`, 'Borrar')) { await borrar(pj.id); irA('#/'); } } }, '🗑 Borrar'),
      ),
    ];
  }

  function historialUI() {
    const lista = pj.historial || [];
    return h('details.historial-hoja', {},
      h('summary', {}, h('h3', {}, `Historial (${lista.length})`), h('small', {}, 'Vuelve a cualquier punto anterior: subidas de nivel, descansos y ediciones.')),
      lista.length ? lista.map((e, i) => h('div.item', {},
        h('span.item-n', {}, h('b', {}, e.d), h('small', {}, ` · ${new Date(e.t).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })} · ${e.quien}${e.dm ? ' (DM)' : ''}`)),
        !ro && h('button.btn.peq', { onclick: () => restaurar(i) }, '↶ Volver aquí'))) : h('p.peq', {}, 'Aún no hay cambios guardados.'),
      ro && dm ? h('p.peq', {}, 'Pulsa «Corregir como DM» arriba para poder deshacer cambios.') : null,
    );
  }

  function partidaSelector() {
    if (!estado.usuario) return h('p.peq', {}, 'Entra con tu cuenta (pestaña Partidas) para unir este personaje a una partida.');
    return campo('Partida', h('select', { onchange: async (e) => { const p = estado.partidas.find((x) => x.id === e.target.value); await asignarPartida(pj, p); toast(p ? `Unido a ${p.nombre}. El DM ya puede verlo.` : 'Sin partida.'); dibujar(); } },
      h('option', { value: '' }, '— ninguna —'), estado.partidas.map((p) => h('option', { value: p.id, selected: pj.partida === p.id }, `${p.nombre}${p.dm === estado.usuario.uid ? ' (eres DM)' : ''}`))));
  }

  const campo = (et, input) => h('label.campo', {}, h('span', {}, et), input);

  dibujar();
  return dibujar;
}
