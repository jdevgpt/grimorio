// Trasfondos y dotes del SRD 5.2 (CC-BY-4.0). Traducción y resumen propios.
// Equipo: cadenas "w:id" (arma), "a:id" (armadura), "po:N" (monedas de oro) o texto libre ("2×Daga" admite cantidad).

export const TRASFONDOS = [
  {
    id: 'acolito', n: 'Acólito', carac: ['INT', 'SAB', 'CAR'], dote: 'iniciado_magia_clerigo',
    habilidades: ['perspicacia', 'religion'], herramienta: 'Útiles de caligrafía',
    d: 'Serviste en un templo, aprendiendo ritos y oraciones.',
    equipo: {
      A: ['Útiles de caligrafía', 'Libro (de oraciones)', 'Símbolo sagrado', '10×Pergamino', 'Túnica', 'po:8'],
      B: ['po:50'],
    },
  },
  {
    id: 'criminal', n: 'Criminal', carac: ['DES', 'CON', 'INT'], dote: 'alerta',
    habilidades: ['juego_manos', 'sigilo'], herramienta: 'Herramientas de ladrón',
    d: 'Te ganaste la vida en callejones, robando y trapicheando.',
    equipo: {
      A: ['2×w:daga', 'Herramientas de ladrón', 'Palanca', '2×Bolsa', 'Ropa de viaje', 'po:16'],
      B: ['po:50'],
    },
  },
  {
    id: 'sabio', n: 'Sabio', carac: ['CON', 'INT', 'SAB'], dote: 'iniciado_magia_mago',
    habilidades: ['arcanos', 'historia'], herramienta: 'Útiles de caligrafía',
    d: 'Pasaste años entre bibliotecas, estudiando el saber del mundo.',
    equipo: {
      A: ['w:baston', 'Útiles de caligrafía', 'Libro (de historia)', '8×Pergamino', 'Túnica', 'po:8'],
      B: ['po:50'],
    },
  },
  {
    id: 'soldado', n: 'Soldado', carac: ['FUE', 'DES', 'CON'], dote: 'atacante_salvaje',
    habilidades: ['atletismo', 'intimidacion'], herramienta: 'Un juego (a elegir)',
    d: 'Te entrenaste para la guerra desde joven y conoces la vida de campaña.',
    equipo: {
      A: ['w:lanza', 'w:arco_corto', '20×Flecha', 'Juego (el mismo de la competencia)', 'Equipo de curandero', 'Carcaj', 'Ropa de viaje', 'po:14'],
      B: ['po:50'],
    },
  },
];

export const DOTES = [
  // Dotes de origen
  { id: 'alerta', n: 'Alerta', tipo: 'origen', d: 'Sumas tu bonificador de competencia a la iniciativa. Justo después de tirar iniciativa, puedes intercambiarla con un aliado voluntario.', iniciativaPB: true },
  { id: 'iniciado_magia_clerigo', n: 'Iniciado en la magia (clérigo)', tipo: 'origen', d: 'Aprendes dos trucos y un conjuro de nivel 1 de la lista de clérigo. Lanzas el de nivel 1 una vez sin espacio por descanso largo (o con espacios). Característica: Inteligencia, Sabiduría o Carisma.', magia: 'clerigo' },
  { id: 'iniciado_magia_druida', n: 'Iniciado en la magia (druida)', tipo: 'origen', d: 'Aprendes dos trucos y un conjuro de nivel 1 de la lista de druida. Lanzas el de nivel 1 una vez sin espacio por descanso largo (o con espacios). Característica: Inteligencia, Sabiduría o Carisma.', magia: 'druida' },
  { id: 'iniciado_magia_mago', n: 'Iniciado en la magia (mago)', tipo: 'origen', d: 'Aprendes dos trucos y un conjuro de nivel 1 de la lista de mago. Lanzas el de nivel 1 una vez sin espacio por descanso largo (o con espacios). Característica: Inteligencia, Sabiduría o Carisma.', magia: 'mago' },
  { id: 'atacante_salvaje', n: 'Atacante salvaje', tipo: 'origen', d: 'Una vez por turno, al impactar con un arma, puedes tirar dos veces los dados de daño del arma y quedarte con el resultado que prefieras.' },
  { id: 'habilidoso', n: 'Habilidoso', tipo: 'origen', d: 'Ganas competencia en tres habilidades o herramientas a tu elección. Puedes elegirla varias veces.', habilidades: 3 },
  // Dotes generales (nivel 4+)
  { id: 'mejora_caracteristica', n: 'Mejora de característica', tipo: 'general', d: 'Aumenta una característica en 2, o dos características en 1. Máximo 20. Puedes elegirla varias veces.' },
  { id: 'agarrador', n: 'Agarrador', tipo: 'general', req: 'FUE o DES 13+', d: '+1 a Fuerza o Destreza. Al impactar con un golpe sin armas como parte de Atacar, puedes causar daño y agarrar a la vez (una vez por turno). Ventaja en ataques contra criaturas que tengas agarradas. Mover a quien agarras no te cuesta movimiento extra si es de tu tamaño o menor.' },
  // Estilos de combate
  { id: 'tiro_con_arco', n: 'Estilo de combate: Tiro con arco', tipo: 'estilo', d: '+2 a las tiradas de ataque con armas a distancia.' },
  { id: 'defensa', n: 'Estilo de combate: Defensa', tipo: 'estilo', d: '+1 a la CA mientras lleves armadura ligera, intermedia o pesada.', caExtraArmadura: 1 },
  { id: 'armas_grandes', n: 'Estilo de combate: Armas a dos manos', tipo: 'estilo', d: 'Al tirar daño con un arma cuerpo a cuerpo a dos manos o versátil empuñada con dos manos, trata los 1 y 2 como 3.' },
  { id: 'dos_armas', n: 'Estilo de combate: Combate con dos armas', tipo: 'estilo', d: 'Al hacer el ataque extra por la propiedad Ligera, sumas tu modificador de característica al daño.' },
  // Dones épicos (nivel 19)
  { id: 'don_combate', n: 'Don de destreza en combate', tipo: 'epico', d: '+1 a una característica (máx. 30). Cuando falles un ataque, puedes convertirlo en impacto. Una vez por turno.' },
  { id: 'don_viaje_dimensional', n: 'Don de viaje dimensional', tipo: 'epico', d: '+1 a una característica (máx. 30). Tras usar Atacar o Lanzar un conjuro, puedes teletransportarte hasta 9 m.' },
  { id: 'don_destino', n: 'Don del destino', tipo: 'epico', d: '+1 a una característica (máx. 30). Cuando una criatura a 18 m haga una prueba de d20, puedes sumarle o restarle 2d4. Se recarga al tirar iniciativa o con un descanso.' },
  { id: 'don_ofensiva', n: 'Don de ofensiva irresistible', tipo: 'epico', d: '+1 a Fuerza o Destreza (máx. 30). Tu daño contundente, cortante y perforante ignora resistencias. Con un 20 natural, sumas daño extra igual a la característica aumentada.' },
  { id: 'don_recuerdo', n: 'Don de recuerdo de conjuros', tipo: 'epico', d: '+1 a Int, Sab o Car (máx. 30). Al lanzar un conjuro con un espacio de nivel 1 a 4, tira 1d4: si sale el nivel del espacio, no lo gastas.' },
  { id: 'don_espiritu_noche', n: 'Don del espíritu nocturno', tipo: 'epico', d: '+1 a una característica (máx. 30). En luz tenue u oscuridad puedes volverte invisible como acción adicional y tienes resistencia a todo el daño salvo psíquico y radiante.' },
  { id: 'don_vision_verdadera', n: 'Don de visión verdadera', tipo: 'epico', d: '+1 a una característica (máx. 30). Tienes visión verdadera a 18 m.' },
];

export const trasfondo = (id) => TRASFONDOS.find((t) => t.id === id);
export const dote = (id) => DOTES.find((d) => d.id === id);
export const DOTES_ORIGEN = DOTES.filter((d) => d.tipo === 'origen');
