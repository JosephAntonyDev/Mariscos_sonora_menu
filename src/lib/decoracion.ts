/**
 * Piezas decorativas "de marisquería" en SVG, compartidas por la página /carta
 * y por las imágenes descargables (src/lib/carta-imagen.ts): papel picado,
 * letrero de madera, olas, cuerda e íconos de categoría.
 */

export const MARISQUERO = {
  turquesa: '#0F8C99',
  turquesaClaro: '#3CC1C9',
  marProfundo: '#0B4F5C',
  coral: '#E4561B',
  amarillo: '#F5B731',
  rosa: '#E5487B',
  lima: '#7DB33A',
  madera: '#8B5530',
  maderaClara: '#A86A3C',
  maderaOscura: '#5E3519',
  arena: '#FFF3DC',
  arenaOscura: '#F2DDB4',
  cafe: '#3B2014',
} as const;

const PICADO = [MARISQUERO.coral, MARISQUERO.amarillo, MARISQUERO.turquesaClaro, MARISQUERO.rosa, MARISQUERO.lima];

const circulo = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

/** Una banderita de papel picado con calados (evenodd = huecos). */
function bandera(x: number, y: number, w: number, h: number, color: string, rot: number) {
  const zig = h * 0.12;
  const dientes = 6;
  let d = `M${x} ${y}H${x + w}V${y + h - zig}`;
  for (let i = dientes; i >= 0; i--) {
    const px = x + (w / dientes) * i;
    d += `L${px} ${i % 2 === 0 ? y + h - zig : y + h}`;
  }
  d += 'Z';
  const cx = x + w / 2;
  const cy = y + h * 0.45;
  // Rombo central, cuatro círculos y una fila de puntos
  const r = w * 0.17;
  d += `M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`;
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) d += circulo(cx + dx * w * 0.27, cy + dy * h * 0.24, w * 0.06);
  for (let i = 1; i <= 4; i++) d += circulo(x + (w / 5) * i, y + h * 0.84 - zig, w * 0.035);
  d += circulo(cx, y + h * 0.1, w * 0.05);
  return `<path d="${d}" fill="${color}" fill-rule="evenodd" transform="rotate(${rot} ${cx} ${y})"/>`;
}

/** Guirnalda de papel picado. Devuelve elementos SVG para un ancho dado. */
export function papelPicado(ancho: number, banderas: number, alto = ancho / banderas * 1.05, y0 = 6, colores: readonly string[] = PICADO) {
  const paso = ancho / banderas;
  const w = paso * 0.86;
  const h = alto * 0.86;
  const caida = alto * 0.06;
  let s = `<path d="M0 ${y0}Q${ancho / 2} ${y0 + caida * 2} ${ancho} ${y0}" fill="none" stroke="${MARISQUERO.maderaOscura}" stroke-width="${Math.max(1.5, alto * 0.025)}"/>`;
  for (let i = 0; i < banderas; i++) {
    const x = i * paso + (paso - w) / 2;
    const t = (x + w / 2) / ancho;
    const y = y0 + caida * 2 * 4 * t * (1 - t) * 0.5; // sigue la curva del cordón
    const rot = ((i * 37) % 7) - 3;
    s += bandera(x, y, w, h, colores[i % colores.length], rot);
  }
  return s;
}

/** SVG completo de papel picado (para HTML). */
export function papelPicadoSVG(banderas: number) {
  const ancho = banderas * 100;
  const alto = 112;
  return `<svg viewBox="0 0 ${ancho} ${alto + 10}" preserveAspectRatio="xMidYMin meet" aria-hidden="true" focusable="false">${papelPicado(ancho, banderas, alto)}</svg>`;
}

/** Letrero de tablas de madera con clavos. Elementos SVG en (x, y, w, h). */
export function letreroMadera(x: number, y: number, w: number, h: number, id = 'madera') {
  const r = h * 0.18;
  let vetas = '';
  for (let i = 1; i <= 3; i++) {
    const vy = y + (h / 4) * i;
    vetas += `<path d="M${x + r} ${vy}C${x + w * 0.3} ${vy - h * 0.05} ${x + w * 0.6} ${vy + h * 0.05} ${x + w - r} ${vy - h * 0.02}" fill="none" stroke="${MARISQUERO.maderaOscura}" stroke-opacity=".35" stroke-width="${h * 0.025}"/>`;
  }
  const clavo = (cx: number) =>
    `<circle cx="${cx}" cy="${y + h / 2}" r="${h * 0.07}" fill="${MARISQUERO.maderaOscura}"/><circle cx="${cx - h * 0.02}" cy="${y + h / 2 - h * 0.02}" r="${h * 0.025}" fill="#D9B48A"/>`;
  return (
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${MARISQUERO.maderaClara}"/><stop offset="1" stop-color="${MARISQUERO.madera}"/></linearGradient></defs>` +
    `<rect x="${x}" y="${y + h * 0.08}" width="${w}" height="${h}" rx="${r}" fill="${MARISQUERO.maderaOscura}" opacity=".45"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#${id})" stroke="${MARISQUERO.maderaOscura}" stroke-width="${h * 0.05}"/>` +
    vetas +
    clavo(x + h * 0.32) +
    clavo(x + w - h * 0.32)
  );
}

export function letreroMaderaSVG(w = 600, h = 110) {
  const p = h * 0.08;
  return `<svg viewBox="0 0 ${w + p * 2} ${h + p * 3}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${letreroMadera(p, p, w, h, 'madera-html')}</svg>`;
}

/** Banda de olas: dos capas para dar profundidad. */
export function olas(ancho: number, y: number, alto: number, c1: string, c2: string, n = 6) {
  const ola = (yy: number, amp: number, fase: number) => {
    const seg = ancho / n;
    let d = `M0 ${yy}`;
    for (let i = 0; i < n; i++) {
      const x0 = i * seg;
      const s = (i + fase) % 2 === 0 ? -1 : 1;
      d += `Q${x0 + seg / 2} ${yy + s * amp} ${x0 + seg} ${yy}`;
    }
    return d + `V${y + alto}H0Z`;
  };
  return `<path d="${ola(y + alto * 0.25, alto * 0.22, 0)}" fill="${c1}"/><path d="${ola(y + alto * 0.5, alto * 0.2, 1)}" fill="${c2}"/>`;
}

/** Patrón de cuerda (rayas diagonales) para bordes. */
export function patronCuerda(id: string) {
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)"><rect width="14" height="14" fill="${MARISQUERO.maderaClara}"/><rect width="6" height="14" fill="${MARISQUERO.maderaOscura}"/></pattern>`;
}

/** Íconos de categoría (trazo, cuadrícula 24). */
export const ICONOS_CATEGORIA = {
  camaron:
    'M17.5 5.5C12 3.5 5.5 6.5 5 12.2c-.3 3.6 2.4 6.3 6.2 6.3 M8.6 8.8l2.3 2.1 M6.4 11.6l3.1.4 M7 15l2.8-1.2 M11.2 18.5l-2.4 3 M11.2 18.5l3.4 2.2 M17.5 5.5l3-3 M17.5 5.5l4.2.8 M17.5 5.5c.6 2.2-.4 4.5-2.6 5.4',
  pez: 'M2.5 12c3-4.8 8.8-6.6 13.6-3.6L20.5 5v14l-4.4-3.4C11.3 18.6 5.5 16.8 2.5 12Z M8 11h.01',
  tostada: 'M3 12a9 9 0 0 0 18 0Z M6 12c.5-2 2-3 3.5-2.4 M10.5 11c.6-2.4 2.6-3.4 4.4-2.2 M15.5 12c.4-1.4 1.6-2.1 2.8-1.6 M8 8.2c.6-.5 1.4-.6 2 0',
  vaso: 'M5.5 6h13l-1.6 14.2a2 2 0 0 1-2 1.8H9.1a2 2 0 0 1-2-1.8Z M6 9.5h12 M14 6l3.5-4 M9 6c-1-1.8-.4-3.6 1.4-4.2 1 1.4.9 3-.4 4.2',
  botella: 'M10 2h4v3.5l2 3V21a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8.5l2-3Z M8 12.5h8 M8 16.5h8',
  estrella: 'M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9Z',
} as const;
export type IconoCategoria = keyof typeof ICONOS_CATEGORIA;
