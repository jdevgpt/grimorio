// Armas y armaduras del SRD 5.2 (CC-BY-4.0). Traducción propia. Alcances en metros.

export const PROPIEDADES = {
  ligera: 'Ligera: permite un ataque extra con otra arma Ligera como acción adicional al usar Atacar (sin sumar el modificador al daño, salvo que sea negativo).',
  sutil: 'Sutil: usa Fuerza o Destreza (la que prefieras) para ataque y daño.',
  arrojadiza: 'Arrojadiza: puedes lanzarla para un ataque a distancia, con el mismo modificador que en cuerpo a cuerpo.',
  dos_manos: 'A dos manos: necesitas ambas manos para atacar con ella.',
  versatil: 'Versátil: puede usarse con una o dos manos (daño indicado entre paréntesis).',
  pesada: 'Pesada: desventaja si tu Fuerza (cuerpo a cuerpo) o Destreza (distancia) es menor de 13.',
  alcance: 'Alcance: añade 1,5 m a tu alcance al atacar con ella.',
  municion: 'Munición: necesitas munición; recuperas la mitad tras el combate.',
  recarga: 'Recarga: solo un disparo por acción, acción adicional o reacción.',
};

export const MAESTRIAS = {
  hender: 'Hender: si impactas, puedes hacer otro ataque contra una segunda criatura a 1,5 m de la primera (una vez por turno). El daño no suma el modificador salvo que sea negativo.',
  rozar: 'Rozar: si fallas, causas daño igual a tu modificador de característica.',
  mella: 'Mella: el ataque extra de la propiedad Ligera forma parte de la acción de Atacar, no de la acción adicional (una vez por turno).',
  empujar: 'Empujar: si impactas, puedes empujar 3 m a una criatura Grande o menor.',
  debilitar: 'Debilitar: si impactas, el objetivo tiene desventaja en su siguiente tirada de ataque antes de tu próximo turno.',
  ralentizar: 'Ralentizar: si impactas y causas daño, reduces 3 m su velocidad hasta tu próximo turno.',
  derribar: 'Derribar: si impactas, el objetivo hace salvación de Constitución (CD 8 + mod. + competencia) o queda Derribado.',
  molestar: 'Molestar: si impactas y causas daño, tienes ventaja en tu siguiente ataque contra él antes del final de tu próximo turno.',
};

// cat: sencilla/marcial · tipo: cac (cuerpo a cuerpo) / dist (distancia)
export const ARMAS = [
  { id: 'clava', n: 'Clava', cat: 'sencilla', tipo: 'cac', dano: '1d4', td: 'Contundente', prop: ['ligera'], m: 'ralentizar', po: 0.1, kg: 1 },
  { id: 'daga', n: 'Daga', cat: 'sencilla', tipo: 'cac', dano: '1d4', td: 'Perforante', prop: ['sutil', 'ligera', 'arrojadiza'], rango: '6/18', m: 'mella', po: 2, kg: 0.5 },
  { id: 'gran_clava', n: 'Gran clava', cat: 'sencilla', tipo: 'cac', dano: '1d8', td: 'Contundente', prop: ['dos_manos'], m: 'empujar', po: 0.2, kg: 5 },
  { id: 'hacha_mano', n: 'Hacha de mano', cat: 'sencilla', tipo: 'cac', dano: '1d6', td: 'Cortante', prop: ['ligera', 'arrojadiza'], rango: '6/18', m: 'molestar', po: 5, kg: 1 },
  { id: 'jabalina', n: 'Jabalina', cat: 'sencilla', tipo: 'cac', dano: '1d6', td: 'Perforante', prop: ['arrojadiza'], rango: '9/36', m: 'ralentizar', po: 0.5, kg: 1 },
  { id: 'martillo_ligero', n: 'Martillo ligero', cat: 'sencilla', tipo: 'cac', dano: '1d4', td: 'Contundente', prop: ['ligera', 'arrojadiza'], rango: '6/18', m: 'mella', po: 2, kg: 1 },
  { id: 'maza', n: 'Maza', cat: 'sencilla', tipo: 'cac', dano: '1d6', td: 'Contundente', prop: [], m: 'debilitar', po: 5, kg: 2 },
  { id: 'baston', n: 'Bastón', cat: 'sencilla', tipo: 'cac', dano: '1d6', vers: '1d8', td: 'Contundente', prop: ['versatil'], m: 'derribar', po: 0.2, kg: 2 },
  { id: 'hoz', n: 'Hoz', cat: 'sencilla', tipo: 'cac', dano: '1d4', td: 'Cortante', prop: ['ligera'], m: 'mella', po: 1, kg: 1 },
  { id: 'lanza', n: 'Lanza', cat: 'sencilla', tipo: 'cac', dano: '1d6', vers: '1d8', td: 'Perforante', prop: ['arrojadiza', 'versatil'], rango: '6/18', m: 'debilitar', po: 1, kg: 1.5 },
  { id: 'dardo', n: 'Dardo', cat: 'sencilla', tipo: 'dist', dano: '1d4', td: 'Perforante', prop: ['sutil', 'arrojadiza'], rango: '6/18', m: 'molestar', po: 0.05, kg: 0.1 },
  { id: 'ballesta_ligera', n: 'Ballesta ligera', cat: 'sencilla', tipo: 'dist', dano: '1d8', td: 'Perforante', prop: ['municion', 'recarga', 'dos_manos'], rango: '24/96', m: 'ralentizar', po: 25, kg: 2.5 },
  { id: 'arco_corto', n: 'Arco corto', cat: 'sencilla', tipo: 'dist', dano: '1d6', td: 'Perforante', prop: ['municion', 'dos_manos'], rango: '24/96', m: 'molestar', po: 25, kg: 1 },
  { id: 'honda', n: 'Honda', cat: 'sencilla', tipo: 'dist', dano: '1d4', td: 'Contundente', prop: ['municion'], rango: '9/36', m: 'ralentizar', po: 0.1, kg: 0 },
  { id: 'hacha_batalla', n: 'Hacha de batalla', cat: 'marcial', tipo: 'cac', dano: '1d8', vers: '1d10', td: 'Cortante', prop: ['versatil'], m: 'derribar', po: 10, kg: 2 },
  { id: 'mayal', n: 'Mayal', cat: 'marcial', tipo: 'cac', dano: '1d8', td: 'Contundente', prop: [], m: 'debilitar', po: 10, kg: 1 },
  { id: 'guja', n: 'Guja', cat: 'marcial', tipo: 'cac', dano: '1d10', td: 'Cortante', prop: ['pesada', 'alcance', 'dos_manos'], m: 'rozar', po: 20, kg: 3 },
  { id: 'gran_hacha', n: 'Gran hacha', cat: 'marcial', tipo: 'cac', dano: '1d12', td: 'Cortante', prop: ['pesada', 'dos_manos'], m: 'hender', po: 30, kg: 3.5 },
  { id: 'espadon', n: 'Espadón', cat: 'marcial', tipo: 'cac', dano: '2d6', td: 'Cortante', prop: ['pesada', 'dos_manos'], m: 'rozar', po: 50, kg: 3 },
  { id: 'alabarda', n: 'Alabarda', cat: 'marcial', tipo: 'cac', dano: '1d10', td: 'Cortante', prop: ['pesada', 'alcance', 'dos_manos'], m: 'hender', po: 20, kg: 3 },
  { id: 'lanza_caballeria', n: 'Lanza de caballería', cat: 'marcial', tipo: 'cac', dano: '1d10', td: 'Perforante', prop: ['pesada', 'alcance', 'dos_manos'], m: 'derribar', po: 10, kg: 3, nota: 'A dos manos salvo si vas montado.' },
  { id: 'espada_larga', n: 'Espada larga', cat: 'marcial', tipo: 'cac', dano: '1d8', vers: '1d10', td: 'Cortante', prop: ['versatil'], m: 'debilitar', po: 15, kg: 1.5 },
  { id: 'mazo', n: 'Mazo', cat: 'marcial', tipo: 'cac', dano: '2d6', td: 'Contundente', prop: ['pesada', 'dos_manos'], m: 'derribar', po: 10, kg: 5 },
  { id: 'lucero_alba', n: 'Lucero del alba', cat: 'marcial', tipo: 'cac', dano: '1d8', td: 'Perforante', prop: [], m: 'debilitar', po: 15, kg: 2 },
  { id: 'pica', n: 'Pica', cat: 'marcial', tipo: 'cac', dano: '1d10', td: 'Perforante', prop: ['pesada', 'alcance', 'dos_manos'], m: 'empujar', po: 5, kg: 9 },
  { id: 'estoque', n: 'Estoque', cat: 'marcial', tipo: 'cac', dano: '1d8', td: 'Perforante', prop: ['sutil'], m: 'molestar', po: 25, kg: 1 },
  { id: 'cimitarra', n: 'Cimitarra', cat: 'marcial', tipo: 'cac', dano: '1d6', td: 'Cortante', prop: ['sutil', 'ligera'], m: 'mella', po: 25, kg: 1.5 },
  { id: 'espada_corta', n: 'Espada corta', cat: 'marcial', tipo: 'cac', dano: '1d6', td: 'Perforante', prop: ['sutil', 'ligera'], m: 'molestar', po: 10, kg: 1 },
  { id: 'tridente', n: 'Tridente', cat: 'marcial', tipo: 'cac', dano: '1d8', vers: '1d10', td: 'Perforante', prop: ['arrojadiza', 'versatil'], rango: '6/18', m: 'derribar', po: 5, kg: 2 },
  { id: 'martillo_guerra', n: 'Martillo de guerra', cat: 'marcial', tipo: 'cac', dano: '1d8', vers: '1d10', td: 'Contundente', prop: ['versatil'], m: 'empujar', po: 15, kg: 2.5 },
  { id: 'pico_guerra', n: 'Pico de guerra', cat: 'marcial', tipo: 'cac', dano: '1d8', vers: '1d10', td: 'Perforante', prop: ['versatil'], m: 'debilitar', po: 5, kg: 1 },
  { id: 'latigo', n: 'Látigo', cat: 'marcial', tipo: 'cac', dano: '1d4', td: 'Cortante', prop: ['sutil', 'alcance'], m: 'ralentizar', po: 2, kg: 1.5 },
  { id: 'cerbatana', n: 'Cerbatana', cat: 'marcial', tipo: 'dist', dano: '1', td: 'Perforante', prop: ['municion', 'recarga'], rango: '7,5/30', m: 'molestar', po: 10, kg: 0.5 },
  { id: 'ballesta_mano', n: 'Ballesta de mano', cat: 'marcial', tipo: 'dist', dano: '1d6', td: 'Perforante', prop: ['municion', 'ligera', 'recarga'], rango: '9/36', m: 'molestar', po: 75, kg: 1.5 },
  { id: 'ballesta_pesada', n: 'Ballesta pesada', cat: 'marcial', tipo: 'dist', dano: '1d10', td: 'Perforante', prop: ['municion', 'pesada', 'recarga', 'dos_manos'], rango: '30/120', m: 'empujar', po: 50, kg: 9 },
  { id: 'arco_largo', n: 'Arco largo', cat: 'marcial', tipo: 'dist', dano: '1d8', td: 'Perforante', prop: ['municion', 'pesada', 'dos_manos'], rango: '45/180', m: 'ralentizar', po: 50, kg: 1 },
  { id: 'mosquete', n: 'Mosquete', cat: 'marcial', tipo: 'dist', dano: '1d12', td: 'Perforante', prop: ['municion', 'recarga', 'dos_manos'], rango: '12/36', m: 'ralentizar', po: 500, kg: 5 },
  { id: 'pistola', n: 'Pistola', cat: 'marcial', tipo: 'dist', dano: '1d10', td: 'Perforante', prop: ['municion', 'recarga'], rango: '9/27', m: 'molestar', po: 250, kg: 1.5 },
];

// base: CA base · dex: true/false/número (máximo) · fue: Fuerza mínima · sig: desventaja en Sigilo
export const ARMADURAS = [
  { id: 'acolchada', n: 'Acolchada', tipo: 'ligera', base: 11, dex: true, sig: true, po: 5, kg: 4 },
  { id: 'cuero', n: 'Cuero', tipo: 'ligera', base: 11, dex: true, po: 10, kg: 5 },
  { id: 'cuero_tachonado', n: 'Cuero tachonado', tipo: 'ligera', base: 12, dex: true, po: 45, kg: 6.5 },
  { id: 'pieles', n: 'Pieles', tipo: 'intermedia', base: 12, dex: 2, po: 10, kg: 6 },
  { id: 'camisote_mallas', n: 'Camisote de mallas', tipo: 'intermedia', base: 13, dex: 2, po: 50, kg: 10 },
  { id: 'cota_escamas', n: 'Cota de escamas', tipo: 'intermedia', base: 14, dex: 2, sig: true, po: 50, kg: 22.5 },
  { id: 'coraza', n: 'Coraza', tipo: 'intermedia', base: 14, dex: 2, po: 400, kg: 10 },
  { id: 'semiplacas', n: 'Semiplacas', tipo: 'intermedia', base: 15, dex: 2, sig: true, po: 750, kg: 20 },
  { id: 'cota_anillas', n: 'Cota de anillas', tipo: 'pesada', base: 14, dex: false, sig: true, po: 30, kg: 20 },
  { id: 'cota_malla', n: 'Cota de malla', tipo: 'pesada', base: 16, dex: false, fue: 13, sig: true, po: 75, kg: 27.5 },
  { id: 'bandas', n: 'Bandas', tipo: 'pesada', base: 17, dex: false, fue: 15, sig: true, po: 200, kg: 30 },
  { id: 'placas', n: 'Placas', tipo: 'pesada', base: 18, dex: false, fue: 15, sig: true, po: 1500, kg: 32.5 },
  { id: 'escudo', n: 'Escudo', tipo: 'escudo', base: 2, po: 10, kg: 3 },
];

export const PAQUETES = {
  'Paquete de explorador': 'Mochila, saco de dormir, 2 frascos de aceite, 10 días de raciones, cuerda, yesquero, 10 antorchas, odre.',
  'Paquete de mazmorreo': 'Mochila, palanca, 10 antorchas, cuerda, 10 días de raciones, yesquero, odre, abrojos.',
  'Paquete de artista': 'Mochila, saco de dormir, 2 disfraces, 8 velas, 5 días de raciones, odre, kit de disfraz.',
  'Paquete de sacerdote': 'Mochila, manta, 2 velas, caja de limosnas, 2 incensarios con incienso, túnica, 2 días de raciones, odre.',
  'Paquete de erudito': 'Mochila, libro, tintero y pluma, cuchillo pequeño, 10 hojas de pergamino, saquito de arena, lámpara, aceite.',
  'Paquete de ladrón': 'Mochila, bolas de rodamiento, campana, 10 velas, palanca, linterna sorda, 7 frascos de aceite, 5 días de raciones, yesquero, cuerda, odre.',
};

export const arma = (id) => ARMAS.find((a) => a.id === id);
export const armadura = (id) => ARMADURAS.find((a) => a.id === id);
