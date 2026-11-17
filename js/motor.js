// Motor de reglas: cálculos derivados y comprobación de la hoja.
import { CARACTERISTICAS, HABILIDADES, mod, bonComp, espaciosConjuro, PACTO_ESPACIOS, PACTO_NIVEL, CONJUNTO_ESTANDAR, COSTE_PUNTOS, PUNTOS_TOTALES, PX } from './datos/reglas.js';
import { clase, INVOCACIONES_BRUJO } from './datos/clases.js';
import { especie } from './datos/especies.js';
import { trasfondo, dote } from './datos/trasfondos.js';
import { arma, armadura } from './datos/equipo.js';
import { conjuroPorNombre, LETRA_CLASE } from './datos/conjuros.js';

export const CAR_IDS = CARACTERISTICAS.map((c) => c.id);
const ceros = () => Object.fromEntries(CAR_IDS.map((c) => [c, 0]));

export function nuevoPersonaje() {
  return {
    id: 'pj_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    v: 1, creado: Date.now(), actualizado: Date.now(),
    nombre: '', jugador: '', nivel: 1, px: 0, alineamiento: '',
    clase: null, eleccion1: null, especie: null, opcion: null, tam: null, caracConj: null,
    trasfondo: null, dotes: [],
    metodo: 'estandar', base: { FUE: 15, DES: 14, CON: 13, INT: 12, SAB: 10, CAR: 8 },
    bonTrasfondo: ceros(), mejoras: ceros(), ajustes: ceros(),
    habilidades: {}, idiomas: ['Común'], herramientas: [],
    pg: { actual: null, temp: 0, tiradas: [], maxManual: null },
    dadosGolpeGastados: 0, muerte: { ok: 0, ko: 0 },
    ca: { manual: null, extra: 0 },
    equipo: [], monedas: { pc: 0, pp: 0, pe: 0, po: 0, ppt: 0 },
    conjuros: [], espaciosGastados: {}, pactoGastados: 0,
    recursos: {}, estados: [], agotamiento: 0, inspiracion: false,
    rasgosExtra: [], notas: '', historia: '', apariencia: '',
    partida: null, owner: null,
  };
}

export function caracFinales(pj) {
  const r = {};
  for (const c of CAR_IDS) {
    r[c] = Number(pj.base?.[c] ?? 10) + Number(pj.bonTrasfondo?.[c] || 0) + Number(pj.mejoras?.[c] || 0) + Number(pj.ajustes?.[c] || 0);
  }
  // Capstones de nivel 20
  if (pj.nivel >= 20 && pj.clase === 'barbaro') { r.FUE = Math.min(25, r.FUE + 4); r.CON = Math.min(25, r.CON + 4); }
  if (pj.nivel >= 20 && pj.clase === 'monje') { r.DES = Math.min(25, r.DES + 4); r.SAB = Math.min(25, r.SAB + 4); }
  return r;
}

export function competenciaArma(pj, a) {
  const cl = clase(pj.clase);
  if (!cl || !a) return false;
  const ar = cl.armas;
  if (a.cat === 'sencilla' && ar.includes('sencillas')) return true;
  if (a.cat === 'marcial') {
    if (ar.includes('marciales')) return true;
    if (pj.clase === 'clerigo' && pj.eleccion1 === 'protector') return true;
    if (pj.clase === 'druida' && pj.eleccion1 === 'guardian') return true;
    if (ar.includes('marciales_ligeras') && a.prop.includes('ligera')) return true;
    if (ar.includes('marciales_sutil_ligera') && (a.prop.includes('ligera') || a.prop.includes('sutil'))) return true;
  }
  return false;
}

export function competenciaArmadura(pj, tipo) {
  const cl = clase(pj.clase);
  if (!cl) return false;
  if (cl.armad.includes(tipo)) return true;
  if (tipo === 'pesada' && pj.clase === 'clerigo' && pj.eleccion1 === 'protector') return true;
  if (tipo === 'intermedia' && pj.clase === 'druida' && pj.eleccion1 === 'guardian') return true;
  return false;
}

export function pgMaximo(pj, car) {
  const cl = clase(pj.clase);
  if (!cl) return 0;
  const cm = mod(car.CON);
  const media = cl.dg / 2 + 1;
  let total = Math.max(1, cl.dg + cm);
  for (let n = 2; n <= pj.nivel; n++) {
    const t = pj.pg?.tiradas?.[n - 2];
    total += Math.max(1, (t ? Number(t) : media) + cm);
  }
  const es = especie(pj.especie);
  if (es?.pgExtraPorNivel) total += pj.nivel * es.pgExtraPorNivel;
  if (pj.clase === 'hechicero' && pj.nivel >= 3) total += pj.nivel; // Resiliencia dracónica
  return total;
}

export function calcular(pj) {
  const car = caracFinales(pj);
  const m = Object.fromEntries(CAR_IDS.map((c) => [c, mod(car[c])]));
  const nv = Math.max(1, Math.min(20, Number(pj.nivel) || 1));
  const pb = bonComp(nv);
  const cl = clase(pj.clase);
  const es = especie(pj.especie);
  const tf = trasfondo(pj.trasfondo);
  const ctx = { nv, pb, mod: m };
  const dotes = [tf?.dote, ...(pj.dotes || [])].filter(Boolean).map(dote).filter(Boolean);

  // Salvaciones
  const salvComp = new Set(cl?.salv || []);
  if (pj.clase === 'monje' && nv >= 14) CAR_IDS.forEach((c) => salvComp.add(c));
  if (pj.clase === 'picaro' && nv >= 15) { salvComp.add('SAB'); salvComp.add('CAR'); }
  const salvaciones = Object.fromEntries(CAR_IDS.map((c) => [c, { comp: salvComp.has(c), v: m[c] + (salvComp.has(c) ? pb : 0) }]));

  // Habilidades
  const aprendizTodo = pj.clase === 'bardo' && nv >= 2;
  const habilidades = HABILIDADES.map((h) => {
    const nivel = pj.habilidades?.[h.id] || 0; // 0, 1 competente, 2 pericia
    let v = m[h.c] + (nivel === 2 ? pb * 2 : nivel === 1 ? pb : aprendizTodo ? Math.floor(pb / 2) : 0);
    return { ...h, nivel, v };
  });
  const percepcion = habilidades.find((h) => h.id === 'percepcion');

  // CA
  const equipadas = (pj.equipo || []).filter((e) => e.equipado && e.ref?.startsWith('a:')).map((e) => armadura(e.ref.slice(2))).filter(Boolean);
  const cuerpo = equipadas.find((a) => a.tipo !== 'escudo');
  const escudo = equipadas.find((a) => a.tipo === 'escudo');
  let ca, caDesc;
  if (cuerpo) {
    const dex = cuerpo.dex === true ? m.DES : cuerpo.dex === false ? 0 : Math.min(cuerpo.dex, m.DES);
    ca = cuerpo.base + dex; caDesc = `${cuerpo.n} ${cuerpo.base}${dex ? ` + Des ${dex}` : ''}`;
  } else if (cl?.caSinArmadura && !(cl.sinEscudo && escudo)) {
    ca = 10 + m.DES + m[cl.caSinArmadura]; caDesc = `Sin armadura: 10 + Des + ${cl.caSinArmadura}`;
  } else if (pj.clase === 'hechicero' && nv >= 3) {
    ca = 10 + m.DES + m.CAR; caDesc = 'Resiliencia dracónica: 10 + Des + Car';
  } else { ca = 10 + m.DES; caDesc = '10 + Des'; }
  if (escudo) { ca += 2; caDesc += ' + escudo 2'; }
  if (cuerpo && dotes.some((d) => d.caExtraArmadura)) { ca += 1; caDesc += ' + Defensa 1'; }
  if (pj.ca?.extra) { ca += Number(pj.ca.extra); caDesc += ` + ${pj.ca.extra}`; }
  const caCalculada = ca;
  if (pj.ca?.manual != null && pj.ca.manual !== '') ca = Number(pj.ca.manual);

  // Velocidad
  let vel = es?.vel ?? 9;
  const lin = es?.opciones?.lista.find((o) => o.id === pj.opcion);
  if (lin?.vel) vel = lin.vel;
  if (pj.clase === 'barbaro' && nv >= 5 && cuerpo?.tipo !== 'pesada') vel += 3;
  if (pj.clase === 'explorador' && nv >= 6 && cuerpo?.tipo !== 'pesada') vel += 3;
  if (pj.clase === 'monje' && nv >= 2 && !cuerpo && !escudo) vel += nv >= 18 ? 9 : nv >= 14 ? 7.5 : nv >= 10 ? 6 : nv >= 6 ? 4.5 : 3;
  if (cuerpo?.fue && car.FUE < cuerpo.fue) vel -= 3;
  vel -= 1.5 * (pj.agotamiento || 0);

  // Iniciativa
  const iniciativa = m.DES + (dotes.some((d) => d.iniciativaPB) ? pb : 0);

  // PG
  const pgCalc = pgMaximo(pj, car);
  const pgMax = pj.pg?.maxManual ? Number(pj.pg.maxManual) : pgCalc;

  // Ataques
  const ataques = [];
  for (const e of pj.equipo || []) {
    if (!e.ref?.startsWith('w:')) continue;
    const a = arma(e.ref.slice(2));
    if (!a) continue;
    let c = a.tipo === 'dist' ? 'DES' : 'FUE';
    const monjeArma = pj.clase === 'monje' && (a.cat === 'sencilla' && a.tipo === 'cac' || a.cat === 'marcial' && a.prop.includes('ligera'));
    if (a.prop.includes('sutil') || monjeArma) c = m.DES >= m.FUE ? 'DES' : 'FUE';
    const comp = competenciaArma(pj, a);
    let bon = m[c] + (comp ? pb : 0);
    if (a.tipo === 'dist' && dotes.some((d) => d.id === 'tiro_con_arco')) bon += 2;
    let dano = a.dano;
    if (monjeArma && nv) {
      const dm = `1d${nv >= 17 ? 12 : nv >= 11 ? 10 : nv >= 5 ? 8 : 6}`;
      if (dadoMedio(dm) > dadoMedio(dano)) dano = dm;
    }
    ataques.push({ n: e.n || a.n, arma: a, car: c, comp, bon, dano: `${dano}${m[c] ? (m[c] > 0 ? '+' : '') + m[c] : ''}`, vers: a.vers ? `${a.vers}${m[c] ? (m[c] > 0 ? '+' : '') + m[c] : ''}` : null, td: a.td });
  }
  // Golpe sin armas
  const monje = pj.clase === 'monje';
  const cu = monje && m.DES > m.FUE ? 'DES' : 'FUE';
  ataques.push({ n: 'Golpe sin armas', car: cu, comp: true, bon: m[cu] + pb, dano: monje ? `1d${nv >= 17 ? 12 : nv >= 11 ? 10 : nv >= 5 ? 8 : 6}${m[cu] ? (m[cu] > 0 ? '+' : '') + m[cu] : ''}` : `${Math.max(1, 1 + m.FUE)}`, td: 'Contundente' });

  // Conjuros
  let magia = null;
  if (cl?.conj) {
    const cc = cl.conj.car;
    magia = {
      car: cc, cd: 8 + m[cc] + pb, ataque: m[cc] + pb,
      trucos: (cl.conj.trucos?.[nv - 1] || 0) + (((pj.clase === 'clerigo' && pj.eleccion1 === 'taumaturgo') || (pj.clase === 'druida' && pj.eleccion1 === 'mago_orden')) ? 1 : 0),
      preparados: cl.conj.prep[nv - 1], tipo: cl.conj.tipo,
      espacios: cl.conj.tipo === 'pacto' ? [] : espaciosConjuro(cl.conj.tipo, nv),
      pacto: cl.conj.tipo === 'pacto' ? { n: PACTO_ESPACIOS[nv - 1], nivel: PACTO_NIVEL[nv - 1] } : null,
    };
  }
  if (!magia && (es?.caracConj || dotes.some((d) => d.magia))) {
    const cc = pj.caracConj || 'SAB';
    magia = { car: cc, cd: 8 + m[cc] + pb, ataque: m[cc] + pb, trucos: 0, preparados: 0, espacios: [], pacto: null, tipo: 'innata' };
  }

  // Rasgos
  const rasgos = [];
  if (es) {
    for (const r of es.rasgos) if (!r.nv || r.nv <= nv) rasgos.push({ ...r, fuente: es.n });
    if (lin) rasgos.push({ n: lin.n, d: lin.d || '', fuente: es.n });
  }
  if (cl) {
    const lista = [...cl.rasgos, ...cl.subclase.rasgos.map((r) => ({ ...r, sub: true }))].filter((r) => r.nv <= nv).sort((a, b) => a.nv - b.nv);
    for (const r of lista) rasgos.push({ ...r, fuente: r.sub ? cl.subclase.n : cl.n });
    if (cl.eleccion1 && pj.eleccion1) {
      const e1 = cl.eleccion1.lista.find((o) => o.id === pj.eleccion1);
      if (e1) rasgos.push({ n: `${cl.eleccion1.n}: ${e1.n}`, d: e1.d, fuente: cl.n });
    }
  }
  if (tf) rasgos.push({ n: `Trasfondo: ${tf.n}`, d: tf.d, fuente: 'Trasfondo' });
  for (const d of dotes) rasgos.push({ n: d.n, d: d.d, fuente: 'Dote' });
  for (const r of pj.rasgosExtra || []) rasgos.push({ ...r, fuente: r.fuente || 'Personal' });

  // Recursos
  const recursos = [...(es?.recursos?.(ctx) || []), ...(cl?.recursos?.(ctx) || [])];
  if (es?.id === 'gnomo' && pj.opcion !== 'bosque') recursos.splice(recursos.findIndex((r) => r.id === 'hablar_animales'), 1);

  return {
    car, mod: m, nv, pb, cl, es, tf, lin, dotes, salvaciones, habilidades,
    percepcionPasiva: 10 + percepcion.v, ca, caCalculada, caDesc, cuerpo, escudo, vel, iniciativa,
    pgMax, pgCalc, ataques, magia, rasgos, recursos,
    dadoGolpe: cl ? `d${cl.dg}` : null,
    vision: lin?.vision || es?.vision || 0,
  };
}

const dadoMedio = (d) => { const [n, c] = String(d).split('d').map(Number); return c ? n * (c + 1) / 2 : n; };

// ---------- Comprobación de reglas ----------
export function contarMejoras(pj) {
  const cl = clase(pj.clase);
  if (!cl) return 0;
  return cl.mejoras.filter((n) => n <= pj.nivel).length;
}

export function habilidadesEsperadas(pj) {
  const cl = clase(pj.clase); const es = especie(pj.especie);
  let n = (cl?.hab.n || 0) + 2;
  if (es?.habilidadElegir) n += 1;
  const dotes = [trasfondo(pj.trasfondo)?.dote, ...(pj.dotes || [])].filter(Boolean);
  n += dotes.filter((d) => d === 'habilidoso').length * 3;
  if (pj.clase === 'bardo' && pj.nivel >= 3) n += 3;
  if (pj.clase === 'barbaro' && pj.nivel >= 3) n += 1;
  return n;
}

export function periciasMaximas(pj) {
  const nv = pj.nivel;
  switch (pj.clase) {
    case 'picaro': return nv >= 6 ? 4 : 2;
    case 'bardo': return nv >= 9 ? 4 : nv >= 2 ? 2 : 0;
    case 'explorador': return nv >= 9 ? 3 : nv >= 2 ? 1 : 0;
    case 'mago': return nv >= 2 ? 1 : 0;
    default: return 0;
  }
}

export function validar(pj) {
  const out = [];
  const err = (t) => out.push({ tipo: 'error', t });
  const av = (t) => out.push({ tipo: 'aviso', t });
  const ok = (t) => out.push({ tipo: 'ok', t });
  const cl = clase(pj.clase); const es = especie(pj.especie); const tf = trasfondo(pj.trasfondo);
  if (!cl) err('Falta la clase.');
  if (!es) err('Falta la especie.');
  if (!tf) err('Falta el trasfondo.');
  if (!pj.nombre?.trim()) av('El personaje no tiene nombre.');
  if (!(pj.nivel >= 1 && pj.nivel <= 20)) err('El nivel debe estar entre 1 y 20.');
  if (es?.opciones && !pj.opcion) err(`Falta elegir ${es.opciones.n.toLowerCase()}.`);
  if (cl?.eleccion1 && !pj.eleccion1) av(`Falta elegir ${cl.eleccion1.n.toLowerCase()}.`);
  if (!cl || !es || !tf) return out;

  // Puntuaciones base
  const base = CAR_IDS.map((c) => Number(pj.base[c]));
  if (pj.metodo === 'estandar') {
    const a = [...base].sort((x, y) => y - x).join(); const b = [...CONJUNTO_ESTANDAR].sort((x, y) => y - x).join();
    if (a !== b) err('Las puntuaciones base no coinciden con el conjunto estándar (15, 14, 13, 12, 10, 8).'); else ok('Conjunto estándar correcto.');
  } else if (pj.metodo === 'puntos') {
    if (base.some((v) => v < 8 || v > 15)) err('Con compra de puntos, cada puntuación base debe estar entre 8 y 15.');
    else {
      const coste = base.reduce((s, v) => s + COSTE_PUNTOS[v], 0);
      if (coste > PUNTOS_TOTALES) err(`Has gastado ${coste} puntos; el máximo es ${PUNTOS_TOTALES}.`);
      else if (coste < PUNTOS_TOTALES) av(`Has gastado ${coste} de ${PUNTOS_TOTALES} puntos.`);
      else ok('Compra de puntos correcta (27).');
    }
  } else if (pj.metodo === 'tirada') {
    if (base.some((v) => v < 3 || v > 18)) err('Con tiradas (4d6, quitando el menor), cada puntuación base va de 3 a 18.');
  }

  // Bonificadores del trasfondo
  const bt = CAR_IDS.filter((c) => Number(pj.bonTrasfondo[c]));
  const fuera = bt.filter((c) => !tf.carac.includes(c));
  const vals = bt.map((c) => Number(pj.bonTrasfondo[c])).sort().join();
  if (fuera.length) err(`El trasfondo ${tf.n} solo permite aumentar ${tf.carac.join(', ')} (has subido ${fuera.join(', ')}).`);
  else if (!(vals === '1,2' || vals === '1,1,1')) err('El trasfondo da +2 y +1 a dos características, o +1 a las tres.');
  else ok(`Aumentos del trasfondo correctos.`);

  // Mejoras por nivel
  const nMej = contarMejoras(pj);
  const dotesGen = (pj.dotes || []).filter((d) => dote(d)?.tipo === 'general' && d !== 'mejora_caracteristica').length;
  const dotesEst = (pj.dotes || []).filter((d) => dote(d)?.tipo === 'estilo').length;
  const puntos = CAR_IDS.reduce((s, c) => s + Number(pj.mejoras[c] || 0), 0);
  const permitidos = (nMej - dotesGen) * 2 + (pj.dotes || []).filter((d) => d === 'agarrador').length;
  if (puntos > permitidos) err(`Has repartido ${puntos} puntos de mejora de característica; a nivel ${pj.nivel} te corresponden como máximo ${Math.max(0, permitidos)} (${nMej} mejoras${dotesGen ? `, ${dotesGen} cambiadas por dotes` : ''}).`);
  else if (puntos < permitidos) av(`Te quedan ${permitidos - puntos} puntos de mejora de característica por repartir (o dotes por elegir).`);
  const estilosEsperados = ({ guerrero: 1, paladin: pj.nivel >= 2 ? 1 : 0, explorador: pj.nivel >= 2 ? 1 : 0 }[pj.clase] || 0) + (pj.clase === 'guerrero' && pj.nivel >= 7 ? 1 : 0);
  if (dotesEst > estilosEsperados) err(`Tienes ${dotesEst} estilos de combate y solo te corresponden ${estilosEsperados}.`);
  else if (dotesEst < estilosEsperados) av(`Te falta elegir ${estilosEsperados - dotesEst} estilo(s) de combate.`);
  const epicos = (pj.dotes || []).filter((d) => dote(d)?.tipo === 'epico').length;
  if (epicos > (pj.nivel >= 19 ? 1 : 0)) err('Los dones épicos solo se obtienen a nivel 19.');
  const origenExtra = (pj.dotes || []).filter((d) => dote(d)?.tipo === 'origen').length;
  if (origenExtra > (es.doteOrigenExtra ? 1 : 0)) err('Tienes más dotes de origen de las permitidas (la del trasfondo, y una extra solo si eres humano).');
  if (es.doteOrigenExtra && origenExtra === 0) av('Como humano, te falta elegir tu dote de origen de Versátil.');

  // Puntuaciones finales
  const car = caracFinales(pj);
  const tope = (c) => (pj.nivel >= 20 && ((pj.clase === 'barbaro' && ['FUE', 'CON'].includes(c)) || (pj.clase === 'monje' && ['DES', 'SAB'].includes(c)))) ? 25 : 20;
  for (const c of CAR_IDS) {
    const sinAjuste = car[c] - Number(pj.ajustes?.[c] || 0);
    if (sinAjuste > tope(c)) err(`${c} ${sinAjuste} supera el máximo de ${tope(c)}.`);
  }
  if (CAR_IDS.some((c) => Number(pj.ajustes?.[c]))) av('Hay ajustes manuales en las características (objetos mágicos u otras fuentes). Revísalos con el DM.');

  // Habilidades
  const comps = Object.entries(pj.habilidades || {}).filter(([, v]) => v >= 1);
  const esperadas = habilidadesEsperadas(pj);
  for (const h of tf.habilidades) if (!pj.habilidades?.[h]) err(`Falta la competencia de trasfondo: ${h.replace('_', ' ')}.`);
  if (comps.length > esperadas) err(`Tienes ${comps.length} competencias en habilidades; te corresponden ${esperadas}.`);
  else if (comps.length < esperadas) av(`Tienes ${comps.length} competencias en habilidades; puedes tener ${esperadas}.`);
  else ok(`Competencias en habilidades correctas (${esperadas}).`);
  const pericias = Object.values(pj.habilidades || {}).filter((v) => v === 2).length;
  const maxPer = periciasMaximas(pj);
  if (pericias > maxPer) err(`Tienes ${pericias} pericias; a este nivel tu clase permite ${maxPer}.`);
  else if (pericias < maxPer) av(`Puedes elegir ${maxPer - pericias} pericia(s) más.`);

  // PG
  if (pj.pg?.maxManual) {
    const m = mod(car.CON);
    let min = Math.max(1, cl.dg + m), max = min;
    for (let n = 2; n <= pj.nivel; n++) { min += Math.max(1, 1 + m); max += Math.max(1, cl.dg + m); }
    const extra = (es.pgExtraPorNivel ? pj.nivel : 0) + (pj.clase === 'hechicero' && pj.nivel >= 3 ? pj.nivel : 0);
    min += extra; max += extra;
    const v = Number(pj.pg.maxManual);
    if (v > max) err(`PG máximos (${v}) por encima de lo posible (${max}).`);
    else if (v < min) err(`PG máximos (${v}) por debajo de lo posible (${min}).`);
    else ok(`PG máximos dentro del rango posible (${min}–${max}).`);
  }

  // Armadura
  const c = calcular(pj);
  if (c.cuerpo && !competenciaArmadura(pj, c.cuerpo.tipo)) av(`No eres competente con armadura ${c.cuerpo.tipo}: desventaja en pruebas de FUE y DES y no puedes lanzar conjuros.`);
  if (c.escudo && !competenciaArmadura(pj, 'escudo')) av('No eres competente con escudos.');
  if (c.cuerpo?.fue && car.FUE < c.cuerpo.fue) av(`${c.cuerpo.n} requiere Fuerza ${c.cuerpo.fue}: pierdes 3 m de velocidad.`);
  if (pj.ca?.manual != null && pj.ca.manual !== '' && Number(pj.ca.manual) !== c.caCalculada) av(`La CA anotada (${pj.ca.manual}) no coincide con la calculada (${c.caCalculada}: ${c.caDesc}).`);
  for (const at of c.ataques) if (at.arma && !at.comp) av(`No eres competente con ${at.arma.n}: no sumas el bonificador de competencia.`);

  // Conjuros
  if (c.magia && c.magia.tipo !== 'innata') {
    const trucos = (pj.conjuros || []).filter((s) => Number(s.nv) === 0 && !s.extra).length;
    const prep = (pj.conjuros || []).filter((s) => Number(s.nv) > 0 && s.prep && !s.siempre).length;
    if (trucos > c.magia.trucos) err(`Conoces ${trucos} trucos de clase; a tu nivel son ${c.magia.trucos}.`);
    else if (trucos < c.magia.trucos) av(`Puedes conocer ${c.magia.trucos} trucos de clase (tienes ${trucos} anotados).`);
    if (prep < c.magia.preparados) av(`Puedes preparar ${c.magia.preparados} conjuros (tienes ${prep} anotados).`);
    if (prep > c.magia.preparados) err(`Tienes ${prep} conjuros preparados; tu máximo es ${c.magia.preparados}.`);
    const maxNv = c.magia.pacto ? c.magia.pacto.nivel : c.magia.espacios.length;
    const altos = (pj.conjuros || []).filter((s) => Number(s.nv) > maxNv && !s.extra);
    const fuera = (pj.clase === 'bardo' && pj.nivel >= 6) ? [] : (pj.conjuros || []).filter((s) => !s.extra && conjuroPorNombre(s.n) && !conjuroPorNombre(s.n).cl.includes(LETRA_CLASE[pj.clase]));
    if (fuera.length) av(`Conjuros que no son de la lista de ${cl.n.toLowerCase()} (válidos solo si vienen de una dote, rasgo u objeto): ${fuera.map((s) => s.n).join(', ')}.`);
    if (altos.length) err(`Tienes conjuros de nivel superior al que puedes lanzar (${maxNv}): ${altos.map((s) => s.n).join(', ')}.`);
  }

  // Nivel y PX
  if (pj.px && Number(pj.px) > 0) {
    const nvPx = PX.filter((x) => Number(pj.px) >= x).length;
    if (nvPx !== pj.nivel) av(`Con ${pj.px} PX corresponde nivel ${nvPx} (tienes ${pj.nivel}). Ignóralo si jugáis por hitos.`);
  }
  if (pj.clase === 'brujo') ok(`Invocaciones a tu nivel: ${INVOCACIONES_BRUJO[pj.nivel - 1]}.`);
  return out;
}

// ---------- Dados ----------
export function tirar(expr) {
  const limpio = String(expr).replace(/\s+/g, '').toLowerCase();
  const partes = limpio.match(/[+-]?[^+-]+/g) || [];
  let total = 0; const detalle = [];
  for (const p of partes) {
    const signo = p.startsWith('-') ? -1 : 1;
    const t = p.replace(/^[+-]/, '');
    const mm = t.match(/^(\d*)d(\d+)(kh1|kl1)?$/);
    if (mm) {
      const n = Number(mm[1] || 1), c = Number(mm[2]);
      const rs = Array.from({ length: Math.min(n, 100) }, () => 1 + Math.floor(Math.random() * c));
      let v = rs.reduce((a, b) => a + b, 0);
      if (mm[3] === 'kh1') v = Math.max(...rs);
      if (mm[3] === 'kl1') v = Math.min(...rs);
      total += signo * v; detalle.push(`${signo < 0 ? '−' : ''}[${rs.join(', ')}]`);
    } else if (!isNaN(Number(t))) { total += signo * Number(t); detalle.push(`${signo < 0 ? '−' : '+'}${t}`); }
  }
  return { total, detalle: detalle.join(' ') };
}
