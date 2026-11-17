// Generador de nombres de fantasía. Combina sílabas según las convenciones de cada pueblo,
// así que los nombres son originales (no copiados de ninguna lista publicada).

const azar = (a) => a[Math.floor(Math.random() * a.length)];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const unir = (...p) => cap(p.join('').replace(/(.)\1\1/g, '$1$1'));

export const ESTILOS = {
  humano: {
    n: 'Humano',
    ini: ['al', 'ber', 'cas', 'dar', 'ed', 'fer', 'gal', 'her', 'ia', 'jul', 'lor', 'mar', 'nor', 'os', 'ram', 'ser', 'tor', 'ul', 'val', 'ro', 'ad', 'el', 'ga', 'li', 'mi'],
    med: ['', '', 'a', 'e', 'i', 'o', 'ri', 'le', 'na', 'ma', 'de'],
    finM: ['ric', 'mund', 'do', 'bert', 'win', 'ran', 'tor', 'lo', 'son', 'mir', 'go', 'nan'],
    finF: ['a', 'ia', 'ena', 'wyn', 'ina', 'da', 'ra', 'elle', 'ith', 'is', 'ana', 'ys'],
    ap: [['Alto', 'Bravo', 'Negro', 'Blanco', 'Roble', 'Piedra', 'Fuente', 'Monte', 'Vado', 'Valle', 'Torre', 'Campo'],
      ['', '', 'mar', 'sol', 'verde', 'claro', 'rojo', 'real', 'viejo', 'del Río', 'de la Vega', 'del Norte']],
    epitetos: ['el Viajero', 'la Audaz', 'el Justo', 'Mano de Hierro', 'el Callado', 'la Errante'],
  },
  elfo: {
    n: 'Elfo',
    ini: ['ae', 'el', 'fae', 'gal', 'il', 'lae', 'lia', 'mir', 'nae', 'syl', 'tha', 'va', 'ar', 'cel', 'eri', 'qua', 'rin', 'ya'],
    med: ['la', 'li', 'ra', 'ren', 'the', 'va', 'ne', 'lo', 'dri', 'sa', ''],
    finM: ['dor', 'driel', 'las', 'nor', 'ion', 'thir', 'van', 'ndil', 'ran', 'sar', 'lor'],
    finF: ['iel', 'wyn', 'thiel', 'ra', 'lie', 'nia', 'riel', 'sha', 'lith', 'ya', 'nya'],
    ap: [['Hoja', 'Brisa', 'Luz', 'Canto', 'Rocío', 'Flor', 'Estrella', 'Sombra', 'Rama', 'Bruma'],
      ['plata', 'estelar', 'de luna', 'del alba', 'eterna', 'del viento', 'de sauce', 'dorada', 'de plata', 'del ocaso']],
    epitetos: ['Canción del Alba', 'el de los Mil Inviernos', 'Ojos de Luna'],
  },
  enano: {
    n: 'Enano',
    ini: ['bal', 'bor', 'brom', 'dur', 'gim', 'gor', 'har', 'kil', 'mor', 'thor', 'tor', 'ul', 'vond', 'dag', 'brun', 'grun', 'ris', 'eld'],
    med: ['', '', 'a', 'i', 'o', 'u', 'ra', 'gr'],
    finM: ['in', 'ar', 'ek', 'rik', 'grim', 'dain', 'li', 'nar', 'gar', 'mund', 'dok'],
    finF: ['hild', 'dis', 'ra', 'gun', 'wyn', 'ja', 'ni', 'lda', 'ri', 'vild'],
    ap: [['Barba', 'Yunque', 'Martillo', 'Hacha', 'Piedra', 'Escudo', 'Forja', 'Hierro', 'Roca', 'Brasa'],
      ['hierro', 'fuerte', 'de piedra', 'roja', 'de granito', 'tronante', 'ardiente', 'de bronce', 'profunda', 'gris']],
    epitetos: ['Rompepiedras', 'el Terco', 'Bebeoro', 'la Indomable'],
  },
  mediano: {
    n: 'Mediano',
    ini: ['al', 'bil', 'ca', 'cor', 'el', 'fin', 'lid', 'mer', 'per', 'ros', 'sam', 'tob', 'wil', 'bel', 'da', 'lav', 'pip', 'mi'],
    med: ['', '', 'a', 'i', 'o', 'e'],
    finM: ['do', 'bo', 'rin', 'ric', 'ton', 'lo', 'by', 'win', 'ry', 'mo'],
    finF: ['a', 'lla', 'ie', 'ly', 'na', 'sy', 'dy', 'ra', 'vy', 'ppa'],
    ap: [['Buen', 'Pie', 'Hoja', 'Alto', 'Bajo', 'Té', 'Miel', 'Cardo', 'Colina', 'Manzano'],
      ['barril', 'ligero', 'de té', 'monte', 'zarzal', 'dulce', 'verde', 'redondo', 'de trébol', 'alegre']],
    epitetos: ['el Afortunado', 'Pies Ligeros', 'la Glotona'],
  },
  gnomo: {
    n: 'Gnomo',
    ini: ['al', 'bim', 'bod', 'dim', 'fon', 'fra', 'gim', 'jeb', 'nis', 'or', 'ros', 'wren', 'zan', 'lil', 'nam', 'tin'],
    med: ['', 'a', 'i', 'o', 'ble', 'ker', 'li'],
    finM: ['ble', 'dle', 'stan', 'kin', 'ston', 'wick', 'bo', 'nock', 'zle', 'fiz'],
    finF: ['ka', 'wyn', 'na', 'li', 'sy', 'ella', 'ni', 'bi', 'za', 'tilly'],
    ap: [['Rueda', 'Tuerca', 'Chispa', 'Engranaje', 'Muelle', 'Lente', 'Gema', 'Burbuja'],
      ['loca', 'dorada', 'veloz', 'de cobre', 'brillante', 'chiflada', 'saltarina', 'giratoria']],
    epitetos: ['el Inventor', 'Dedos Ágiles', 'la Curiosa'],
  },
  orco: {
    n: 'Orco',
    ini: ['gor', 'kru', 'mog', 'thok', 'urz', 'grom', 'dag', 'brak', 'og', 'vol', 'hol', 'shu', 'yur', 'ruk', 'zug', 'kar'],
    med: ['', '', 'a', 'u', 'o'],
    finM: ['ash', 'gar', 'nak', 'rok', 'ug', 'th', 'mak', 'gul', 'zog', 'dush'],
    finF: ['a', 'ra', 'ga', 'ka', 'sha', 'ul', 'ova', 'ytha', 'bah', 'nka'],
    ap: [['Colmillo', 'Puño', 'Cráneo', 'Sangre', 'Hueso', 'Garra', 'Grito', 'Ceniza'],
      ['roto', 'negro', 'rojo', 'de trueno', 'ardiente', 'partido', 'salvaje', 'helado']],
    epitetos: ['el Implacable', 'Tres Cicatrices', 'la Furiosa', 'Rompeescudos'],
  },
  tiflin: {
    n: 'Tiflin',
    ini: ['ak', 'am', 'bar', 'dam', 'ek', 'ia', 'kal', 'lev', 'mor', 'ne', 'or', 'ska', 'zar', 'ma', 'ri', 'vel'],
    med: ['', 'a', 'e', 'i', 'ro', 'ka', 'ze'],
    finM: ['mon', 'akas', 'thos', 'zar', 'ius', 'mos', 'kai', 'rax', 'el', 'oth'],
    finF: ['kia', 'ria', 'meia', 'is', 'ira', 'xa', 'lis', 'ssa', 'ith', 'zara'],
    virtudes: ['Esperanza', 'Canción', 'Ardor', 'Penitencia', 'Valor', 'Misterio', 'Tormento', 'Gloria', 'Pesar', 'Ruina', 'Promesa', 'Silencio'],
    epitetos: ['la Marcada', 'Ojos de Brasa', 'el Desterrado'],
  },
  draconido: {
    n: 'Dracónido',
    ini: ['ar', 'bal', 'dona', 'gha', 'hes', 'kri', 'med', 'nad', 'pan', 'rho', 'sha', 'tor', 'kav', 'sora', 'thar', 'vrak'],
    med: ['', 'a', 'i', 'ra', 'ka', 'sh'],
    finM: ['jhan', 'asar', 'rash', 'kas', 'rinn', 'xan', 'zun', 'ath', 'vok', 'dar'],
    finF: ['ra', 'thys', 'shann', 'nyx', 'mys', 'kava', 'rith', 'zys', 'vora', 'sora'],
    clanes: ['Kepesh', 'Myastan', 'Daardend', 'Turnuroth', 'Ophinshtal', 'Kimbatuul', 'Nemmonis', 'Verthisathurgiesh', 'Yarjerit', 'Delmirev', 'Prexijandilin', 'Clethtinthiallor'].map((c) => c.slice(0, 3) + azar(['khar', 'thesh', 'urion', 'vash', 'imar', 'ozzar', 'enth', 'arak'])),
    epitetos: ['Escama de Cobre', 'el Ardiente', 'Aliento de Tormenta'],
  },
  goliat: {
    n: 'Goliat',
    ini: ['au', 'eg', 'gae', 'ke', 'lo', 'ma', 'na', 'pa', 'tha', 'u', 'vi', 'ka', 'ga', 'ilik'],
    med: ['', 'ka', 'ga', 'la', 'ri', 'u'],
    finM: ['kan', 'thak', 'lath', 'nak', 'ul', 'gar', 'mak', 'thal'],
    finF: ['ka', 'ra', 'ani', 'nia', 'ga', 'thi', 'vi', 'lu'],
    apodos: ['Cazaosos', 'Tejedor de Nubes', 'Mano Firme', 'Salto Largo', 'Ojo de Halcón', 'Piedra que Canta', 'Sin Miedo', 'Cuerno Partido'],
    epitetos: ['el Gigante', 'Pico Helado'],
  },
};

// Criaturas para combates
export const MONSTRUOS = {
  goblin: { n: 'Goblin', base: ['Grik', 'Snag', 'Mek', 'Zit', 'Nub', 'Pog', 'Rax', 'Skib', 'Yik', 'Glob', 'Fizz', 'Krug'], fin: ['zak', 'nik', 'gob', 'ik', 'it', 'ub', ''], tit: ['el Tuerto', 'Dientes Rotos', 'Orejas Largas', 'el Rápido', 'Muerdetobillos', 'el Apestoso'] },
  kobold: { n: 'Kóbold', base: ['Kik', 'Tak', 'Snik', 'Mep', 'Yip', 'Drak', 'Zix', 'Rik', 'Pik'], fin: ['-ki', 'tak', 'sik', 'ix', 'po', ''], tit: ['Cola Corta', 'el Cavador', 'Escama Gris', 'Trampero'] },
  bandido: { n: 'Bandido', base: ['Rufo', 'Bartolo', 'Mara', 'Tobías', 'Greta', 'Brus', 'Sancha', 'Ulric', 'Tilda', 'Garo', 'Nela', 'Dimas'], fin: [''], tit: ['el Rajado', 'Cuchillo', 'la Zorra', 'Tres Dedos', 'el Cuervo', 'Mala Sombra', 'el Tuerto', 'la Viuda'] },
  muerto: { n: 'No muerto', base: ['Vorth', 'Maleth', 'Sorn', 'Ghal', 'Mortis', 'Kael', 'Vex', 'Ossa', 'Ilth'], fin: ['ar', 'iel', 'oth', 'uus', 'ra', ''], tit: ['el Sin Descanso', 'de la Cripta', 'el Pálido', 'Huesos Viejos', 'el Olvidado'] },
  demonio: { n: 'Demonio / diablo', base: ['Baz', 'Xar', 'Mol', 'Zeth', 'Kra', 'Vul', 'Az', 'Gor', 'Ny'], fin: ['ugoth', 'thrax', 'ephel', 'ariel', 'zul', 'gorath', 'imon'], tit: ['el Devorador', 'Señor de Cenizas', 'el Susurrante', 'de los Mil Ojos'] },
  bestia: { n: 'Bestia / monstruo', base: ['Colmillo', 'Garra', 'Sombra', 'Trueno', 'Ceniza', 'Hambre', 'Niebla', 'Espina'], fin: [''], tit: ['Negra', 'Plateada', 'del Pantano', 'del Bosque', 'Hambrienta', 'Tuerta', 'Vieja', 'de las Cuevas'] },
  gigante: { n: 'Ogro / gigante', base: ['Grum', 'Thog', 'Brakka', 'Ulg', 'Morg', 'Dun', 'Hrom', 'Gub'], fin: ['', 'ar', 'us', 'ok'], tit: ['Rompecasas', 'el Glotón', 'Pies de Barro', 'Machacahuesos'] },
  culto: { n: 'Cultista', base: ['Hermano', 'Hermana', 'Acólito', 'Profeta', 'Vidente', 'Guardián'], fin: [''], tit: ['de la Llama Negra', 'del Ojo Velado', 'Sin Rostro', 'de la Serpiente', 'del Último Eclipse'] },
};

export const ESPECIE_A_ESTILO = { draconido: 'draconido', enano: 'enano', elfo: 'elfo', gnomo: 'gnomo', goliat: 'goliat', mediano: 'mediano', humano: 'humano', orco: 'orco', tiflin: 'tiflin' };

function nombrePila(e, genero) {
  const g = genero === 'cualquiera' ? azar(['m', 'f']) : genero;
  const silabas = Math.random() < 0.55 ? [azar(e.ini), azar(e.med)] : [azar(e.ini)];
  return unir(...silabas, azar(g === 'f' ? e.finF : e.finM));
}

export function generarNombre(estiloId = 'humano', genero = 'cualquiera', conApellido = true) {
  if (MONSTRUOS[estiloId]) {
    const m = MONSTRUOS[estiloId];
    const base = azar(m.base) + azar(m.fin);
    return Math.random() < 0.75 ? `${base} ${azar(m.tit)}` : base;
  }
  const e = ESTILOS[estiloId] || ESTILOS.humano;
  const pila = nombrePila(e, genero);
  if (!conApellido) return pila;
  if (estiloId === 'tiflin') return Math.random() < 0.3 ? azar(e.virtudes) : `${pila}${Math.random() < 0.3 ? ' ' + azar(e.epitetos) : ''}`;
  if (estiloId === 'draconido') return `${pila} del clan ${azar(e.clanes)}`;
  if (estiloId === 'goliat') return `${pila} «${azar(e.apodos)}» ${unir(azar(e.ini), azar(e.med), azar(e.finM)).toLowerCase().replace(/^./, (c) => c.toUpperCase())}`;
  const [a, b] = e.ap;
  const p2 = azar(b);
  const apellido = p2.includes(' ') ? `${azar(a)} ${p2}` : unir(azar(a).toLowerCase(), p2);
  const r = Math.random();
  return r < 0.12 ? `${pila} ${azar(e.epitetos)}` : `${pila} ${apellido}`;
}

export const listaNombres = (estilo, genero, n = 8) => {
  const s = new Set();
  let intentos = 0;
  while (s.size < n && intentos++ < 60) s.add(generarNombre(estilo, genero));
  return [...s];
};
