// Calendario de Harptos (Reinos Olvidados): 12 meses de 30 días + 5 festividades (+ Encuentro de Escudos en años bisiestos).
// Conversión por día del año, igual que la librería faerun-date de Cantilux (MIT): https://github.com/Cantilux/faerun-date
// El año en Cómputo de los Valles (CV) se calcula como año real − 528 (2026 → 1498 CV).

export const MESES = [
  { n: 'Hammer', apodo: 'Pleno Invierno', est: 'invierno' },
  { n: 'Alturiak', apodo: 'La Garra del Invierno', est: 'invierno' },
  { n: 'Ches', apodo: 'La Garra de los Ocasos', est: 'primavera' },
  { n: 'Tarsakh', apodo: 'La Garra de las Tormentas', est: 'primavera' },
  { n: 'Mirtul', apodo: 'El Deshielo', est: 'primavera' },
  { n: 'Kythorn', apodo: 'La Hora de las Flores', est: 'verano' },
  { n: 'Flamerule', apodo: 'La Marea del Verano', est: 'verano' },
  { n: 'Eleasis', apodo: 'Altosol', est: 'verano' },
  { n: 'Eleint', apodo: 'La Menguante', est: 'otono' },
  { n: 'Marpenoth', apodo: 'La Caída de las Hojas', est: 'otono' },
  { n: 'Uktar', apodo: 'La Pudrición', est: 'otono' },
  { n: 'Nightal', apodo: 'El Ocaso del Año', est: 'invierno' },
];
// Festividad que va después del mes indicado (índice)
export const FIESTAS = [
  { tras: 0, n: 'Midwinter', es: 'Mediados del Invierno', est: 'invierno' },
  { tras: 3, n: 'Greengrass', es: 'Hierbaverde', est: 'primavera' },
  { tras: 6, n: 'Midsummer', es: 'Pleno Verano', est: 'verano' },
  { tras: 6, n: 'Shieldmeet', es: 'Encuentro de Escudos', est: 'verano', bisiesto: true },
  { tras: 8, n: 'Highharvestide', es: 'Alta Cosecha', est: 'otono' },
  { tras: 10, n: 'Feast of the Moon', es: 'Festín de la Luna', est: 'invierno' },
];
export const ESTACIONES = {
  invierno: { n: 'Invierno', icono: '❄' },
  primavera: { n: 'Primavera', icono: '❀' },
  verano: { n: 'Verano', icono: '☀' },
  otono: { n: 'Otoño', icono: '🍂' },
};

const bisiesto = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const diaDelAño = (f) => Math.floor((Date.UTC(f.getFullYear(), f.getMonth(), f.getDate()) - Date.UTC(f.getFullYear(), 0, 1)) / 86400000) + 1;

// Lista ordenada de los días del año de Harptos
function calendario(esBisiesto) {
  const dias = [];
  MESES.forEach((m, i) => {
    for (let d = 1; d <= 30; d++) dias.push({ mes: i, dia: d });
    FIESTAS.filter((f) => f.tras === i && (!f.bisiesto || esBisiesto)).forEach((f) => dias.push({ fiesta: f }));
  });
  return dias;
}

export function aHarptos(fecha = new Date()) {
  const y = fecha.getFullYear();
  const cal = calendario(bisiesto(y));
  const n = diaDelAño(fecha);
  const d = cal[n - 1];
  const año = y - 528;
  // Próxima festividad
  let prox = null;
  for (let k = n; k < cal.length; k++) if (cal[k].fiesta) { prox = { fiesta: cal[k].fiesta, faltan: k - n + 1 }; break; }
  if (!prox) { const c2 = calendario(bisiesto(y + 1)); const k = c2.findIndex((x) => x.fiesta); prox = { fiesta: c2[k].fiesta, faltan: cal.length - n + k + 1 }; }
  if (d.fiesta) return { fiesta: d.fiesta, año, estacion: d.fiesta.est, texto: `${d.fiesta.es} (${d.fiesta.n}), ${año} CV`, corto: `${d.fiesta.es}, ${año} CV`, prox };
  const m = MESES[d.mes];
  return {
    mes: m, dia: d.dia, año, estacion: m.est, decenio: Math.ceil(d.dia / 10), diaDecenio: ((d.dia - 1) % 10) + 1,
    texto: `${d.dia} de ${m.n}, ${año} CV`, corto: `${d.dia} de ${m.n}, ${año} CV`, prox,
  };
}
