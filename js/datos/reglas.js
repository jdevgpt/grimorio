// Reglas generales — basadas en el SRD 5.2 (CC-BY-4.0, Wizards of the Coast). Traducción y resumen propios.

export const CARACTERISTICAS = [
  { id: 'FUE', n: 'Fuerza' },
  { id: 'DES', n: 'Destreza' },
  { id: 'CON', n: 'Constitución' },
  { id: 'INT', n: 'Inteligencia' },
  { id: 'SAB', n: 'Sabiduría' },
  { id: 'CAR', n: 'Carisma' },
];

export const HABILIDADES = [
  { id: 'acrobacias', n: 'Acrobacias', c: 'DES' },
  { id: 'arcanos', n: 'Arcanos', c: 'INT' },
  { id: 'atletismo', n: 'Atletismo', c: 'FUE' },
  { id: 'engano', n: 'Engaño', c: 'CAR' },
  { id: 'historia', n: 'Historia', c: 'INT' },
  { id: 'interpretacion', n: 'Interpretación', c: 'CAR' },
  { id: 'intimidacion', n: 'Intimidación', c: 'CAR' },
  { id: 'investigacion', n: 'Investigación', c: 'INT' },
  { id: 'juego_manos', n: 'Juego de manos', c: 'DES' },
  { id: 'medicina', n: 'Medicina', c: 'SAB' },
  { id: 'naturaleza', n: 'Naturaleza', c: 'INT' },
  { id: 'percepcion', n: 'Percepción', c: 'SAB' },
  { id: 'perspicacia', n: 'Perspicacia', c: 'SAB' },
  { id: 'persuasion', n: 'Persuasión', c: 'CAR' },
  { id: 'religion', n: 'Religión', c: 'INT' },
  { id: 'sigilo', n: 'Sigilo', c: 'DES' },
  { id: 'supervivencia', n: 'Supervivencia', c: 'SAB' },
  { id: 'trato_animales', n: 'Trato con animales', c: 'SAB' },
];

export const habilidad = (id) => HABILIDADES.find((h) => h.id === id);

export const mod = (v) => Math.floor((Number(v || 10) - 10) / 2);
export const fmt = (n) => (n >= 0 ? `+${n}` : `${n}`);
export const bonComp = (nv) => 2 + Math.floor((Math.max(1, nv) - 1) / 4);

export const CONJUNTO_ESTANDAR = [15, 14, 13, 12, 10, 8];
export const COSTE_PUNTOS = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const PUNTOS_TOTALES = 27;

// Experiencia necesaria por nivel
export const PX = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

// Espacios de conjuro de lanzador completo, por nivel de personaje (índice 0 = nivel 1)
export const ESPACIOS_COMPLETO = [
  [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
];
// Brujo: magia del pacto
export const PACTO_ESPACIOS = [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4];
export const PACTO_NIVEL = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];

export function espaciosConjuro(tipo, nv) {
  if (tipo === 'completo') return ESPACIOS_COMPLETO[nv - 1];
  if (tipo === 'medio') return ESPACIOS_COMPLETO[Math.ceil(nv / 2) - 1];
  return [];
}

export const IDIOMAS_ESTANDAR = ['Común', 'Lengua de signos común', 'Dracónico', 'Enano', 'Élfico', 'Gigante', 'Gnomo', 'Goblin', 'Mediano', 'Orco'];
export const IDIOMAS_RAROS = ['Abisal', 'Celestial', 'Druídico', 'Habla profunda', 'Infernal', 'Primordial', 'Silvano', 'Infracomún', 'Jerga de ladrones'];

export const ALINEAMIENTOS = ['Legal bueno', 'Neutral bueno', 'Caótico bueno', 'Legal neutral', 'Neutral', 'Caótico neutral', 'Legal malvado', 'Neutral malvado', 'Caótico malvado'];

export const ESTADOS = [
  { id: 'agarrado', n: 'Agarrado', d: 'Velocidad 0. Desventaja en ataques contra objetivos que no sean quien te agarra. Quien te agarra puede moverte (cuesta movimiento extra).' },
  { id: 'apresado', n: 'Apresado', d: 'Velocidad 0. Los ataques contra ti tienen ventaja y los tuyos desventaja. Desventaja en salvaciones de Destreza.' },
  { id: 'asustado', n: 'Asustado', d: 'Desventaja en pruebas de característica y tiradas de ataque mientras veas la fuente del miedo. No puedes acercarte voluntariamente a ella.' },
  { id: 'aturdido', n: 'Aturdido', d: 'Incapacitado. Fallas automáticamente las salvaciones de Fuerza y Destreza. Los ataques contra ti tienen ventaja.' },
  { id: 'cegado', n: 'Cegado', d: 'No ves y fallas las pruebas que dependan de la vista. Los ataques contra ti tienen ventaja y los tuyos desventaja.' },
  { id: 'derribado', n: 'Derribado', d: 'Solo puedes arrastrarte o levantarte (cuesta la mitad de tu velocidad). Desventaja en tus ataques. Los ataques contra ti tienen ventaja si el atacante está a 1,5 m, y desventaja si no.' },
  { id: 'ensordecido', n: 'Ensordecido', d: 'No oyes y fallas las pruebas que dependan del oído.' },
  { id: 'envenenado', n: 'Envenenado', d: 'Desventaja en tiradas de ataque y pruebas de característica.' },
  { id: 'hechizado', n: 'Hechizado', d: 'No puedes atacar ni dañar a quien te hechizó. Este tiene ventaja en pruebas para interactuar socialmente contigo.' },
  { id: 'incapacitado', n: 'Incapacitado', d: 'No puedes realizar acciones, acciones adicionales ni reacciones. Pierdes la concentración. No puedes hablar. Desventaja en iniciativa.' },
  { id: 'inconsciente', n: 'Inconsciente', d: 'Incapacitado y derribado; sueltas lo que lleves. Velocidad 0. Fallas salvaciones de Fuerza y Destreza. Ataques contra ti con ventaja; si impactan a 1,5 m, son críticos.' },
  { id: 'invisible', n: 'Invisible', d: 'Ventaja en iniciativa. No te afectan efectos que requieran verte. Tus ataques tienen ventaja y los ataques contra ti desventaja.' },
  { id: 'paralizado', n: 'Paralizado', d: 'Incapacitado. Velocidad 0. Fallas salvaciones de Fuerza y Destreza. Ataques contra ti con ventaja; si impactan a 1,5 m, son críticos.' },
  { id: 'petrificado', n: 'Petrificado', d: 'Te conviertes en piedra: incapacitado, velocidad 0, resistencia a todo el daño, inmune al veneno. Fallas salvaciones de Fuerza y Destreza.' },
];
export const AGOTAMIENTO = 'Cada nivel de agotamiento resta 2 a tus pruebas de d20 y 1,5 m a tu velocidad. Con 6 niveles mueres. Un descanso largo quita 1 nivel.';

export const TIPOS_DANO = ['Ácido', 'Contundente', 'Cortante', 'Frío', 'Fuego', 'Fuerza', 'Necrótico', 'Perforante', 'Psíquico', 'Radiante', 'Relámpago', 'Trueno', 'Veneno'];

// Resumen de reglas para la consulta rápida
export const REGLAS_BASICAS = [
  { n: 'Pruebas de d20', d: 'Tira 1d20 + modificador de característica + bonificador de competencia (si eres competente). Si igualas o superas la CD o la CA, tienes éxito. Hay tres tipos: pruebas de característica, tiradas de salvación y tiradas de ataque.' },
  { n: 'Ventaja y desventaja', d: 'Con ventaja tiras 2d20 y te quedas el mayor; con desventaja, el menor. Si tienes las dos a la vez, se anulan y tiras un solo d20.' },
  { n: 'Crítico y pifia', d: 'Un 20 natural en una tirada de ataque impacta siempre y es crítico: tira el doble de dados de daño. Un 1 natural falla siempre.' },
  { n: 'Inspiración heroica', d: 'Si la tienes, puedes gastarla para repetir cualquier tirada de dado y quedarte con el nuevo resultado. Solo se puede tener una vez.' },
  { n: 'Iniciativa', d: 'Al empezar un combate, cada participante hace una prueba de Destreza. Se actúa de mayor a menor.' },
  { n: 'Tu turno', d: 'En tu turno puedes moverte hasta tu velocidad y realizar una acción. Puede que tengas una acción adicional si un rasgo te la da. Tienes una reacción por ronda, que puedes usar incluso en el turno de otro.' },
  { n: 'Acciones', d: 'Atacar, Buscar, Ayudar, Correr (Dash), Destrabarse (Disengage), Esquivar, Esconderse, Estudiar, Influir, Lanzar un conjuro, Preparar, Usar un objeto, Utilizar (Utilize).' },
  { n: 'Ataque de oportunidad', d: 'Cuando una criatura hostil que ves sale de tu alcance, puedes usar tu reacción para hacerle un ataque cuerpo a cuerpo.' },
  { n: 'Cobertura', d: 'Media cobertura: +2 a la CA y a las salvaciones de Destreza. Tres cuartos: +5. Total: no se te puede elegir como objetivo directamente.' },
  { n: 'Caer a 0 PG', d: 'Quedas inconsciente. Al empezar cada turno haces una salvación contra muerte (d20): 10 o más es éxito. Con 3 éxitos te estabilizas; con 3 fallos mueres. Un 20 natural te devuelve 1 PG; un 1 natural cuenta como 2 fallos. Recibir daño estando a 0 cuenta como un fallo.' },
  { n: 'Muerte instantánea', d: 'Si el daño que te deja a 0 PG supera tus PG máximos (el daño restante es igual o mayor que tu máximo), mueres directamente.' },
  { n: 'Descanso corto', d: 'Al menos 1 hora. Puedes gastar dados de golpe: tira cada uno y suma tu modificador de Constitución para recuperar PG.' },
  { n: 'Descanso largo', d: 'Al menos 8 horas. Recuperas todos los PG y todos los dados de golpe gastados, y reduces 1 nivel de agotamiento. Solo uno cada 24 horas.' },
  { n: 'Concentración', d: 'Algunos conjuros requieren concentración. Si recibes daño, haz una salvación de Constitución (CD 10 o la mitad del daño, la mayor; máximo 30) para mantenerla. Solo puedes concentrarte en un conjuro a la vez.' },
  { n: 'CD de conjuros', d: 'CD de salvación = 8 + modificador de la característica de lanzamiento + bonificador de competencia. Ataque de conjuro = modificador + bonificador de competencia.' },
  { n: 'Agarrar', d: 'Golpe sin armas: el objetivo hace una salvación de Fuerza o Destreza (a su elección) contra CD 8 + tu mod. de Fuerza + tu bonificador de competencia. Si falla, queda Agarrado.' },
  { n: 'Empujar', d: 'Golpe sin armas: el objetivo hace la misma salvación que al agarrar. Si falla, lo empujas 1,5 m o lo derribas.' },
  { n: 'Visión en la oscuridad', d: 'Ves en luz tenue como si fuera brillante, y en la oscuridad como si fuera luz tenue, pero sin colores.' },
  { n: 'Viajes', d: 'Ritmo rápido: 6 km/h (−5 a Percepción pasiva). Normal: 4,5 km/h. Lento: 3 km/h (puedes usar sigilo).' },
  { n: 'Carga', d: 'Puedes cargar 7 kg por cada punto de Fuerza (criatura Mediana). Puedes arrastrar, levantar o empujar el doble.' },
];
