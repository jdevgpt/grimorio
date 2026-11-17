// Asistente de subida de nivel: muestra solo las elecciones del nivel que se gana
import { h, modal, toast } from '../ui.js';
import { CARACTERISTICAS, HABILIDADES, habilidad, fmt, PX } from '../datos/reglas.js';
import { clase, INVOCACIONES_BRUJO } from '../datos/clases.js';
import { especie } from '../datos/especies.js';
import { DOTES, dote } from '../datos/trasfondos.js';
import { calcular, caracFinales, periciasMaximas, tirar, CAR_IDS } from '../motor.js';

export async function asistenteNivel(pj, reglas) {
  const c = calcular(pj, reglas);
  const cl = clase(pj.clase); const es = especie(pj.especie);
  const nv = pj.nivel + 1;
  const media = cl.dg / 2 + 1;
  const fin = caracFinales(pj);
  const nuevos = [...cl.rasgos, ...cl.subclase.rasgos.map((r) => ({ ...r, sub: true }))].filter((r) => r.nv === nv);
  const rasgosEspecie = (es?.rasgos || []).filter((r) => r.nv === nv);
  const esMejora = cl.mejoras.includes(nv);
  const esEpico = nv === 19;
  const estilo = (nv === 2 && ['paladin', 'explorador'].includes(pj.clase)) || (nv === 7 && pj.clase === 'guerrero');
  const periciasNuevas = periciasMaximas({ ...pj, nivel: nv }) - periciasMaximas(pj);
  const habNuevas = (nv === 3 && pj.clase === 'bardo') ? 3 : (nv === 3 && pj.clase === 'barbaro') ? 1 : 0;
  const cNuevo = calcular({ ...pj, nivel: nv }, reglas);
  const trucosMas = (cNuevo.magia?.trucos || 0) - (c.magia?.trucos || 0);
  const prepMas = (cNuevo.magia?.preparados || 0) - (c.magia?.preparados || 0);
  const nivelConjMax = cNuevo.magia ? (cNuevo.magia.pacto ? cNuevo.magia.pacto.nivel : cNuevo.magia.espacios.length) : 0;
  const nivelConjAntes = c.magia ? (c.magia.pacto ? c.magia.pacto.nivel : c.magia.espacios.length) : 0;
  const invoc = pj.clase === 'brujo' ? INVOCACIONES_BRUJO[nv - 1] - INVOCACIONES_BRUJO[nv - 2] : 0;

  const modoPG = reglas?.pgNivel || 'eleccion';
  const el = {
    pg: modoPG === 'tirada' ? tirar(`1d${cl.dg}`).total : media, pgTirado: modoPG === 'tirada',
    mejora: 'carac', c1: null, c2: null, dote: null, doteCarac: null,
    epico: null, epicoCarac: null, estilo: null, pericias: [], habilidades: [],
  };

  const cuerpo = h('div.asistente');
  const pintar = () => cuerpo.replaceChildren(...[
    h('p.subt', {}, `${cl.n} ${pj.nivel} → ${nv}${nv === 3 ? ` · ${cl.subclase.n}` : ''}`),
    PX[nv - 1] > (pj.px || 0) && pj.px && reglas?.experiencia !== 'hitos' ? h('p.ayuda.mal', {}, `Necesitas ${PX[nv - 1]} PX para este nivel (tienes ${pj.px}).`) : null,

    seccion('Puntos de golpe',
      modoPG === 'eleccion' ? h('div.segmentado', {},
        h('button' + (!el.pgTirado ? '.sel' : ''), { onclick: () => { el.pg = media; el.pgTirado = false; pintar(); } }, `Media (${media})`),
        h('button' + (el.pgTirado ? '.sel' : ''), { onclick: () => { el.pg = tirar(`1d${cl.dg}`).total; el.pgTirado = true; pintar(); } }, `🎲 Tirar d${cl.dg}`)) :
        h('p.peq', {}, modoPG === 'media' ? 'Tu DM usa siempre la media.' : 'Tu DM pide tirar el dado.'),
      h('p.grande', {}, `+${Math.max(1, el.pg + c.mod.CON) + (es?.pgExtraPorNivel || 0) + (pj.clase === 'hechicero' && nv >= 3 ? (nv === 3 ? 3 : 1) : 0)} PG`, h('small', {}, el.pgTirado ? ` (sacaste ${el.pg})` : ` (${el.pg} ${fmt(c.mod.CON)} Con)`)),
    ),

    [...nuevos, ...rasgosEspecie].some((r) => !r.mejora) ? seccion('Rasgos nuevos', [...nuevos, ...rasgosEspecie].filter((r) => !r.mejora).map((r) => h('p.peq', {}, h('b', {}, r.n + (r.sub ? ` (${cl.subclase.n})` : '') + '. '), r.d))) : null,

    esMejora ? seccion('Mejora de característica o dote', mejoraUI(), true) : null,
    esEpico ? seccion('Don épico', epicoUI(), true) : null,
    estilo ? seccion('Estilo de combate', h('select', { onchange: (e) => { el.estilo = e.target.value || null; pintar(); } },
      h('option', { value: '' }, '— elige —'), DOTES.filter((d) => d.tipo === 'estilo' && !pj.dotes.includes(d.id)).map((d) => h('option', { value: d.id, selected: el.estilo === d.id }, d.n.replace('Estilo de combate: ', '')))),
      el.estilo && h('p.peq', {}, dote(el.estilo).d), true) : null,
    periciasNuevas > 0 ? seccion(`Pericia: elige ${periciasNuevas}`, eleccionHab(Object.keys(pj.habilidades).filter((k) => pj.habilidades[k] === 1), 'pericias', periciasNuevas), true) : null,
    habNuevas > 0 ? seccion(`Competencia${habNuevas > 1 ? 's' : ''} nueva${habNuevas > 1 ? 's' : ''}: elige ${habNuevas}`,
      eleccionHab(HABILIDADES.map((x) => x.id).filter((k) => !pj.habilidades[k] && (pj.clase === 'bardo' || cl.hab.de.includes(k))), 'habilidades', habNuevas), true) : null,

    (trucosMas > 0 || prepMas > 0 || nivelConjMax > nivelConjAntes || invoc > 0) ? seccion('Magia',
      trucosMas > 0 && h('p', {}, `✧ Aprendes ${trucosMas} truco(s) más.`),
      prepMas > 0 && h('p', {}, `✧ Puedes preparar ${prepMas} conjuro(s) más (total ${cNuevo.magia.preparados}).`),
      nivelConjMax > nivelConjAntes && h('p', {}, `✧ Ya puedes lanzar conjuros de nivel ${nivelConjMax}.`),
      invoc > 0 && h('p', {}, `✧ Aprendes ${invoc} invocación(es) sobrenatural(es) más.`),
      h('p.peq', {}, 'Añádelos después desde la pestaña Conjuros (el grimorio ya filtrará por tu nuevo nivel).')) : null,
  ].flat(Infinity).filter((x) => x != null && x !== false));

  function seccion(titulo, ...hijos) {
    const obligatoria = hijos[hijos.length - 1] === true; if (obligatoria) hijos.pop();
    return h('div.as-sec', {}, h('h4', {}, titulo, obligatoria ? h('span.oblig', {}, ' · obligatorio') : ''), ...hijos);
  }

  function mejoraUI() {
    const generales = DOTES.filter((d) => d.tipo === 'general' && d.id !== 'mejora_caracteristica' && !pj.dotes.includes(d.id));
    const permiteDotes = reglas?.dotesPermitidas !== false;
    const selCar = (k) => h('select', { onchange: (e) => { el[k] = e.target.value || null; pintar(); } }, h('option', { value: '' }, '—'),
      CARACTERISTICAS.map((x) => h('option', { value: x.id, selected: el[k] === x.id, disabled: fin[x.id] + (el.c1 === x.id && k === 'c2' ? 1 : 0) >= 20 }, `${x.n} (${fin[x.id]})`)));
    return [
      permiteDotes && h('div.segmentado', {},
        h('button' + (el.mejora === 'carac' ? '.sel' : ''), { onclick: () => { el.mejora = 'carac'; pintar(); } }, 'Subir características'),
        h('button' + (el.mejora === 'dote' ? '.sel' : ''), { onclick: () => { el.mejora = 'dote'; pintar(); } }, 'Elegir dote')),
      el.mejora === 'carac' ? h('div', {},
        h('p.peq', {}, 'Elige dos veces +1 (puede ser la misma característica para +2). Máximo 20.'),
        h('div.fila2', {}, h('label.campo', {}, h('span', {}, '+1 a'), selCar('c1')), h('label.campo', {}, h('span', {}, '+1 a'), selCar('c2')))) :
        h('div', {}, h('select', { onchange: (e) => { el.dote = e.target.value || null; pintar(); } }, h('option', { value: '' }, '— elige dote —'), generales.map((d) => h('option', { value: d.id, selected: el.dote === d.id }, d.n + (d.req ? ` (req. ${d.req})` : '')))),
          el.dote && h('p.peq', {}, dote(el.dote).d),
          el.dote === 'agarrador' && h('label.campo', {}, h('span', {}, '+1 a'), h('select', { onchange: (e) => { el.doteCarac = e.target.value; } }, h('option', { value: '' }, '—'), ['FUE', 'DES'].map((x) => h('option', { selected: el.doteCarac === x }, x))))),
    ];
  }

  function epicoUI() {
    return [
      h('select', { onchange: (e) => { el.epico = e.target.value || null; pintar(); } }, h('option', { value: '' }, '— elige don —'), DOTES.filter((d) => d.tipo === 'epico').map((d) => h('option', { value: d.id, selected: el.epico === d.id }, d.n))),
      el.epico && h('p.peq', {}, dote(el.epico).d),
      el.epico && h('label.campo', {}, h('span', {}, '+1 a (máx. 30)'), h('select', { onchange: (e) => { el.epicoCarac = e.target.value; } }, h('option', { value: '' }, '—'), CAR_IDS.map((x) => h('option', { selected: el.epicoCarac === x }, x)))),
    ];
  }

  function eleccionHab(opciones, clave, max) {
    return h('div.lista-hab', {}, opciones.map((k) => {
      const sel = el[clave].includes(k);
      return h('button.hab' + (sel ? (clave === 'pericias' ? '.pericia' : '.comp') : ''), { onclick: () => {
        if (sel) el[clave] = el[clave].filter((x) => x !== k);
        else if (el[clave].length < max) el[clave] = [...el[clave], k];
        else toast(`Solo puedes elegir ${max}.`);
        pintar();
      } }, h('span.marca', {}, sel ? '◆' : '○'), habilidad(k).n);
    }));
  }

  const falta = () => {
    if (esMejora && el.mejora === 'carac' && (!el.c1 || !el.c2)) return 'Elige las dos mejoras de característica.';
    if (esMejora && el.mejora === 'carac' && el.c1 === el.c2 && fin[el.c1] + 2 > 20) return 'Esa característica superaría 20.';
    if (esMejora && el.mejora === 'dote' && !el.dote) return 'Elige una dote.';
    if (el.dote === 'agarrador' && !el.doteCarac) return 'Elige FUE o DES para Agarrador.';
    if (esEpico && (!el.epico || !el.epicoCarac)) return 'Elige tu don épico y la característica.';
    if (estilo && !el.estilo) return 'Elige un estilo de combate.';
    if (el.pericias.length < periciasNuevas) return `Elige ${periciasNuevas} pericia(s).`;
    if (el.habilidades.length < habNuevas) return `Elige ${habNuevas} habilidad(es).`;
    return null;
  };

  pintar();
  while (true) {
    const ok = await modal(`Subir a nivel ${nv}`, cuerpo, [{ t: 'Cancelar', v: false }, { t: 'Confirmar', v: true, clase: 'rojo' }]);
    if (!ok) return null;
    const f = falta();
    if (!f) break;
    toast(f, 3500);
  }

  // Aplicar
  return (p) => {
    p.pg.tiradas[nv - 2] = el.pgTirado ? el.pg : null;
    p.nivel = nv;
    if (esMejora) {
      if (el.mejora === 'carac') { p.mejoras[el.c1] = (p.mejoras[el.c1] || 0) + 1; p.mejoras[el.c2] = (p.mejoras[el.c2] || 0) + 1; }
      else { p.dotes.push(el.dote); if (el.doteCarac) p.mejoras[el.doteCarac] = (p.mejoras[el.doteCarac] || 0) + 1; }
    }
    if (esEpico) { p.dotes.push(el.epico); p.mejoras[el.epicoCarac] = (p.mejoras[el.epicoCarac] || 0) + 1; }
    if (el.estilo) p.dotes.push(el.estilo);
    el.pericias.forEach((k) => { p.habilidades[k] = 2; });
    el.habilidades.forEach((k) => { p.habilidades[k] = 1; });
    if (nv === 2 && p.clase === 'paladin' && !p.conjuros.some((s) => s.n === 'Castigo divino')) p.conjuros.push({ n: 'Castigo divino', nv: 1, prep: true, extra: true, siempre: true, fuente: 'Castigo del paladín' });
  };
}
