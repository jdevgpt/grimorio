// Especies del SRD 5.2 (CC-BY-4.0). Traducción y resumen propios.
// vel en metros. Cada rasgo: { n, d, nv? (nivel mínimo) }.
// opciones: { id, n, lista: [{id, n, d, conjuros?}] } para linajes/ancestros.
// recursos(ctx): contadores para la hoja. ctx = { nv, pb, mod }

export const ESPECIES = [
  {
    id: 'draconido', n: 'Dracónido', tam: ['Mediano'], vel: 9,
    resumen: 'Descendientes de dragones, con aliento elemental y alas a partir de nivel 5.',
    opciones: {
      id: 'ancestro', n: 'Ancestro dracónico', lista: [
        { id: 'negro', n: 'Negro (ácido)', dano: 'Ácido' },
        { id: 'azul', n: 'Azul (relámpago)', dano: 'Relámpago' },
        { id: 'laton', n: 'Latón (fuego)', dano: 'Fuego' },
        { id: 'bronce', n: 'Bronce (relámpago)', dano: 'Relámpago' },
        { id: 'cobre', n: 'Cobre (ácido)', dano: 'Ácido' },
        { id: 'oro', n: 'Oro (fuego)', dano: 'Fuego' },
        { id: 'verde', n: 'Verde (veneno)', dano: 'Veneno' },
        { id: 'rojo', n: 'Rojo (fuego)', dano: 'Fuego' },
        { id: 'plata', n: 'Plata (frío)', dano: 'Frío' },
        { id: 'blanco', n: 'Blanco (frío)', dano: 'Frío' },
      ],
    },
    rasgos: [
      { n: 'Ancestro dracónico', d: 'Elige un tipo de dragón. Determina el tipo de daño de tu Arma de aliento y de tu Resistencia al daño.' },
      { n: 'Arma de aliento', d: 'Al usar la acción de Atacar puedes sustituir uno de los ataques por un aliento en cono de 4,5 m o línea de 9 m × 1,5 m. Salvación de Destreza (CD 8 + mod. Con + competencia): 1d10 de daño, la mitad si supera. Sube a 2d10 (nv 5), 3d10 (nv 11) y 4d10 (nv 17). Usos = bonificador de competencia por descanso largo.' },
      { n: 'Resistencia al daño', d: 'Tienes resistencia al tipo de daño de tu ancestro.' },
      { n: 'Visión en la oscuridad', d: '18 m.' },
      { n: 'Vuelo dracónico', nv: 5, d: 'Acción adicional: te salen alas espectrales durante 10 minutos y tienes velocidad de vuelo igual a tu velocidad. Una vez por descanso largo.' },
    ],
    vision: 18,
    recursos: ({ nv, pb }) => [
      { id: 'aliento', n: 'Arma de aliento', max: pb, rec: 'largo', nota: `${nv >= 17 ? 4 : nv >= 11 ? 3 : nv >= 5 ? 2 : 1}d10` },
      ...(nv >= 5 ? [{ id: 'vuelo', n: 'Vuelo dracónico', max: 1, rec: 'largo' }] : []),
    ],
  },
  {
    id: 'enano', n: 'Enano', tam: ['Mediano'], vel: 9,
    resumen: 'Robustos y resistentes, con gran visión en la oscuridad y afinidad con la piedra.',
    rasgos: [
      { n: 'Visión en la oscuridad', d: '36 m.' },
      { n: 'Resiliencia enana', d: 'Resistencia al daño de veneno. Ventaja en salvaciones para evitar o terminar el estado Envenenado.' },
      { n: 'Dureza enana', d: 'Tus PG máximos aumentan en 1, y en 1 más cada vez que subes de nivel.' },
      { n: 'Afinidad con la piedra', d: 'Acción adicional: obtienes sentido de la vibración de 18 m durante 10 minutos mientras estés sobre piedra o la toques. Usos = bonificador de competencia por descanso largo.' },
    ],
    vision: 36, pgExtraPorNivel: 1,
    recursos: ({ pb }) => [{ id: 'piedra', n: 'Afinidad con la piedra', max: pb, rec: 'largo' }],
  },
  {
    id: 'elfo', n: 'Elfo', tam: ['Mediano'], vel: 9,
    resumen: 'Longevos y mágicos. Eligen linaje: drow, alto elfo o elfo silvano.',
    caracConjuros: true,
    habilidadElegir: { n: 'Sentidos agudos', de: ['perspicacia', 'percepcion', 'supervivencia'] },
    opciones: {
      id: 'linaje', n: 'Linaje élfico', lista: [
        { id: 'drow', n: 'Drow', d: 'Visión en la oscuridad de 36 m. Truco Luces danzantes; nv 3: Fuego feérico; nv 5: Oscuridad.', conjuros: [[1, 'Luces danzantes'], [3, 'Fuego feérico'], [5, 'Oscuridad']], vision: 36 },
        { id: 'alto', n: 'Alto elfo', d: 'Truco Prestidigitación (puedes cambiarlo por otro truco de mago tras un descanso largo); nv 3: Detectar magia; nv 5: Paso brumoso.', conjuros: [[1, 'Prestidigitación'], [3, 'Detectar magia'], [5, 'Paso brumoso']] },
        { id: 'silvano', n: 'Elfo silvano', d: 'Velocidad 10,5 m. Truco Druidismo; nv 3: Zancada prodigiosa; nv 5: Pasar sin rastro.', conjuros: [[1, 'Druidismo'], [3, 'Zancada prodigiosa'], [5, 'Pasar sin rastro']], vel: 10.5 },
      ],
    },
    rasgos: [
      { n: 'Visión en la oscuridad', d: '18 m (36 m si eres drow).' },
      { n: 'Linaje élfico', d: 'Obtienes los conjuros de tu linaje. Los de nivel 1+ los lanzas una vez sin gastar espacio por descanso largo (o con espacios). Elige Inteligencia, Sabiduría o Carisma como característica para lanzarlos.' },
      { n: 'Ascendencia feérica', d: 'Ventaja en salvaciones para evitar o terminar el estado Hechizado.' },
      { n: 'Sentidos agudos', d: 'Competencia en Perspicacia, Percepción o Supervivencia.' },
      { n: 'Trance', d: 'No necesitas dormir y la magia no puede dormirte. Completas un descanso largo en 4 horas de meditación.' },
    ],
    vision: 18,
  },
  {
    id: 'gnomo', n: 'Gnomo', tam: ['Pequeño'], vel: 9,
    resumen: 'Pequeños, astutos e ingeniosos, con magia de ilusión o inventiva.',
    caracConjuros: true,
    opciones: {
      id: 'linaje', n: 'Linaje gnomo', lista: [
        { id: 'bosque', n: 'Gnomo de los bosques', d: 'Truco Ilusión menor. Siempre tienes preparado Hablar con los animales y puedes lanzarlo sin espacio tantas veces como tu bonificador de competencia por descanso largo.', conjuros: [[1, 'Ilusión menor'], [1, 'Hablar con los animales']] },
        { id: 'roca', n: 'Gnomo de las rocas', d: 'Trucos Remendar y Prestidigitación. Puedes crear pequeños mecanismos de relojería (CA 5, 1 PG) con 10 minutos de trabajo.', conjuros: [[1, 'Remendar'], [1, 'Prestidigitación']] },
      ],
    },
    rasgos: [
      { n: 'Visión en la oscuridad', d: '18 m.' },
      { n: 'Astucia gnoma', d: 'Ventaja en salvaciones de Inteligencia, Sabiduría y Carisma.' },
      { n: 'Linaje gnomo', d: 'Obtienes la magia de tu linaje. Elige Inteligencia, Sabiduría o Carisma como característica para lanzarla.' },
    ],
    vision: 18,
    recursos: ({ pb }) => [{ id: 'hablar_animales', n: 'Hablar con los animales (gnomo de los bosques)', max: pb, rec: 'largo' }],
  },
  {
    id: 'goliat', n: 'Goliat', tam: ['Mediano'], vel: 10.5,
    resumen: 'Descendientes de gigantes, enormes y fuertes, con un don de su ancestro.',
    opciones: {
      id: 'ancestro', n: 'Ancestro gigante', lista: [
        { id: 'nubes', n: 'Salto de las nubes', d: 'Acción adicional: te teletransportas hasta 9 m a un espacio que veas.' },
        { id: 'fuego', n: 'Quemadura del fuego', d: 'Al impactar con un ataque, causas 1d10 de daño de fuego adicional.' },
        { id: 'escarcha', n: 'Frío de la escarcha', d: 'Al impactar con un ataque, causas 1d6 de frío adicional y reduces 3 m la velocidad del objetivo hasta tu siguiente turno.' },
        { id: 'colinas', n: 'Caída de las colinas', d: 'Al impactar a una criatura Grande o menor, la derribas.' },
        { id: 'piedra', n: 'Aguante de la piedra', d: 'Reacción al recibir daño: tiras 1d12 + mod. de Con y reduces el daño en esa cantidad.' },
        { id: 'tormenta', n: 'Trueno de la tormenta', d: 'Reacción al recibir daño de una criatura a 18 m: le causas 1d8 de daño de trueno.' },
      ],
    },
    rasgos: [
      { n: 'Ancestro gigante', d: 'Elige un don sobrenatural. Usos = bonificador de competencia por descanso largo.' },
      { n: 'Forma grande', nv: 5, d: 'Acción adicional: te vuelves Grande durante 10 minutos. Ventaja en pruebas de Fuerza y +3 m de velocidad. Una vez por descanso largo.' },
      { n: 'Complexión poderosa', d: 'Ventaja en pruebas para terminar el estado Agarrado. Cuentas como una categoría de tamaño mayor para cargar peso.' },
    ],
    recursos: ({ nv, pb }) => [
      { id: 'don_gigante', n: 'Ancestro gigante', max: pb, rec: 'largo' },
      ...(nv >= 5 ? [{ id: 'forma_grande', n: 'Forma grande', max: 1, rec: 'largo' }] : []),
    ],
  },
  {
    id: 'mediano', n: 'Mediano', tam: ['Pequeño'], vel: 9,
    resumen: 'Pequeños, valientes y con una suerte asombrosa.',
    rasgos: [
      { n: 'Valiente', d: 'Ventaja en salvaciones para evitar o terminar el estado Asustado.' },
      { n: 'Agilidad mediana', d: 'Puedes moverte por el espacio de cualquier criatura de tamaño mayor que el tuyo (no puedes terminar allí).' },
      { n: 'Suerte', d: 'Cuando sacas un 1 en el d20 de una prueba de d20, puedes repetir la tirada y debes usar el nuevo resultado.' },
      { n: 'Sigilo natural', d: 'Puedes intentar esconderte aunque solo te oculte una criatura al menos un tamaño mayor que tú.' },
    ],
  },
  {
    id: 'humano', n: 'Humano', tam: ['Mediano', 'Pequeño'], vel: 9,
    resumen: 'Versátiles y llenos de recursos. Ganan una habilidad y una dote de origen extra.',
    habilidadElegir: { n: 'Habilidoso', de: 'todas' },
    doteOrigenExtra: true,
    rasgos: [
      { n: 'Lleno de recursos', d: 'Ganas Inspiración heroica cada vez que terminas un descanso largo.' },
      { n: 'Habilidoso', d: 'Competencia en una habilidad a tu elección.' },
      { n: 'Versátil', d: 'Ganas una dote de origen a tu elección (se recomienda Habilidoso).' },
    ],
  },
  {
    id: 'orco', n: 'Orco', tam: ['Mediano'], vel: 9,
    resumen: 'Resistentes e incansables, con una oleada de adrenalina en combate.',
    rasgos: [
      { n: 'Subidón de adrenalina', d: 'Acción adicional: usas la acción de Correr y ganas PG temporales iguales a tu bonificador de competencia. Usos = bonificador de competencia por descanso corto o largo.' },
      { n: 'Visión en la oscuridad', d: '36 m.' },
      { n: 'Aguante incansable', d: 'Si caes a 0 PG sin morir, te quedas con 1 PG. Una vez por descanso largo.' },
    ],
    vision: 36,
    recursos: ({ pb }) => [
      { id: 'adrenalina', n: 'Subidón de adrenalina', max: pb, rec: 'corto' },
      { id: 'aguante', n: 'Aguante incansable', max: 1, rec: 'largo' },
    ],
  },
  {
    id: 'tiflin', n: 'Tiflin', tam: ['Mediano', 'Pequeño'], vel: 9,
    resumen: 'Con sangre de los planos inferiores y un legado infernal, abisal o ctónico.',
    caracConjuros: true,
    opciones: {
      id: 'legado', n: 'Legado infernal', lista: [
        { id: 'abisal', n: 'Abisal', d: 'Resistencia al veneno. Truco Rociada venenosa; nv 3: Rayo enfermizo; nv 5: Inmovilizar persona.', conjuros: [[1, 'Rociada venenosa'], [3, 'Rayo enfermizo'], [5, 'Inmovilizar persona']] },
        { id: 'ctonico', n: 'Ctónico', d: 'Resistencia al necrótico. Truco Toque gélido; nv 3: Falsa vida; nv 5: Rayo debilitador.', conjuros: [[1, 'Toque gélido'], [3, 'Falsa vida'], [5, 'Rayo debilitador']] },
        { id: 'infernal', n: 'Infernal', d: 'Resistencia al fuego. Truco Descarga de fuego; nv 3: Reprensión infernal; nv 5: Oscuridad.', conjuros: [[1, 'Descarga de fuego'], [3, 'Reprensión infernal'], [5, 'Oscuridad']] },
      ],
    },
    rasgos: [
      { n: 'Visión en la oscuridad', d: '18 m.' },
      { n: 'Legado infernal', d: 'Obtienes la resistencia y los conjuros de tu legado. Los de nivel 1+ los lanzas una vez sin espacio por descanso largo. Elige Inteligencia, Sabiduría o Carisma para lanzarlos.' },
      { n: 'Presencia de otro mundo', d: 'Conoces el truco Taumaturgia.' },
    ],
    vision: 18,
  },
];

export const especie = (id) => ESPECIES.find((e) => e.id === id);
