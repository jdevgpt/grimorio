// Reglas opcionales que el DM activa para su partida

export const REGLAS_MESA = [
  { id: 'carga', n: 'Peso y carga', tipo: 'opcion', def: 'no', opciones: [
    ['no', 'Sin control de peso', 'No se tiene en cuenta lo que llevan los personajes.'],
    ['estandar', 'Capacidad de carga', 'Pueden cargar 7 kg por punto de Fuerza (el doble si son Grandes o goliats). Si se pasan, su velocidad baja a 1,5 m.'],
    ['variante', 'Carga detallada', 'Más de 2,5 kg × FUE: −3 m de velocidad. Más de 5 kg × FUE: −6 m y desventaja en pruebas, ataques y salvaciones de FUE, DES y CON.'],
  ] },
  { id: 'monedasPesan', n: 'Las monedas pesan', tipo: 'si_no', def: false, d: '50 monedas pesan 0,5 kg.' },
  { id: 'municion', n: 'Contar munición', tipo: 'si_no', def: false, d: 'Cada ataque con arco, ballesta, honda o arma de fuego gasta una munición del inventario.' },
  { id: 'metodos', n: 'Puntuaciones de característica permitidas', tipo: 'multi', def: ['estandar', 'puntos', 'tirada'], opciones: [
    ['estandar', 'Conjunto estándar'], ['puntos', 'Compra de puntos'], ['tirada', 'Tirar dados (4d6)'],
  ] },
  { id: 'pgNivel', n: 'PG al subir de nivel', tipo: 'opcion', def: 'eleccion', opciones: [
    ['eleccion', 'A elección del jugador', 'Media o tirada, lo que prefiera cada uno.'],
    ['media', 'Siempre la media', 'Nadie tira: todos usan el valor fijo.'],
    ['tirada', 'Siempre se tira', 'Hay que tirar el dado de golpe.'],
  ] },
  { id: 'experiencia', n: 'Progresión', tipo: 'opcion', def: 'px', opciones: [
    ['px', 'Puntos de experiencia', 'Se anotan PX y la app avisa si no cuadran con el nivel.'],
    ['hitos', 'Por hitos', 'El DM decide cuándo se sube de nivel; se ocultan los PX.'],
  ] },
  { id: 'descansos', n: 'Descansos', tipo: 'opcion', def: 'estandar', opciones: [
    ['estandar', 'Normales', 'Corto: 1 hora. Largo: 8 horas.'],
    ['heroico', 'Heroicos', 'Corto: 5 minutos. Largo: 1 hora.'],
    ['realista', 'Realistas', 'Corto: 8 horas. Largo: 7 días.'],
  ] },
  { id: 'pocionAdicional', n: 'Beber poción como acción adicional', tipo: 'si_no', def: false, d: 'Beberse una poción uno mismo cuesta una acción adicional en vez de una acción.' },
  { id: 'dotesPermitidas', n: 'Dotes permitidas', tipo: 'si_no', def: true, d: 'Si se desactiva, las mejoras de nivel solo pueden ser aumentos de característica.' },
];

export const REGLAS_DEFECTO = Object.fromEntries(REGLAS_MESA.map((r) => [r.id, r.def]));
export const conDefecto = (r) => ({ ...REGLAS_DEFECTO, ...(r || {}) });

export function textoRegla(id, valor) {
  const r = REGLAS_MESA.find((x) => x.id === id);
  if (r.tipo === 'si_no') return valor ? 'Sí' : 'No';
  if (r.tipo === 'multi') return r.opciones.filter(([v]) => valor.includes(v)).map(([, t]) => t).join(', ');
  return r.opciones.find(([v]) => v === valor)?.[1] || '—';
}

// Pesos orientativos (kg) para objetos comunes del equipo inicial
export const PESOS = [
  [/paquete de explorador/i, 25], [/paquete de mazmorreo/i, 25], [/paquete de artista/i, 26], [/paquete de sacerdote/i, 13],
  [/paquete de erudito/i, 10], [/paquete de ladr/i, 19], [/flecha|virote|bala/i, 0.025], [/carcaj/i, 0.5], [/libro de conjuros/i, 1.5],
  [/libro/i, 2.5], [/pergamino/i, 0], [/t[úu]nica/i, 2], [/ropa/i, 2], [/herramientas de ladr/i, 0.5], [/[úu]tiles de caligraf/i, 2.5],
  [/[úu]tiles de herbolar|herborista/i, 1.5], [/s[íi]mbolo sagrado/i, 0.5], [/palanca/i, 2.5], [/bolsa/i, 0.5], [/equipo de curandero/i, 1.5],
  [/foco/i, 1], [/instrumento/i, 1.5], [/juego/i, 0], [/herramienta de artesano/i, 2.5], [/cuerda/i, 2.5], [/antorcha/i, 0.5], [/raci[óo]n/i, 1],
];
export const pesoEstimado = (nombre) => PESOS.find(([re]) => re.test(nombre))?.[1] ?? 0;
