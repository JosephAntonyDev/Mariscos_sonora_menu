// Utilidades compartidas por los generadores de marca e imágenes sociales.
// Convierte texto en trazos vectoriales (sin depender de fuentes instaladas).
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';

// process.cwd(): estos helpers también se ejecutan dentro del build de Astro
// (endpoints de /descargas), donde import.meta.url apunta al bundle, no al repo.
export const ROOT = process.cwd();
export const r = (...s) => path.join(ROOT, ...s);

/** Paleta oficial (sincronizada con src/styles/tokens.css). */
export const COLOR = {
  cafe: '#3B2014', // letras y contornos del logo
  cobre: '#A65E3C', // cara de la moneda
  oro: '#C9A468', // aro de la moneda
  oroClaro: '#E9D3A4',
  camaron: '#E4561B', // mascota, acentos y llamadas a la acción
  mar: '#0E4A57', // fondos profundos
  marClaro: '#1C7D86',
  arena: '#F7EFE3', // fondo principal
  blanco: '#FFFFFF',
  negro: '#000000',
};

const loadFont = (pkg, file) => {
  const b = fs.readFileSync(r('node_modules/@fontsource', pkg, 'files', file));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
export const FONT = {
  // Baloo 2: títulos, precios y rótulos
  extrabold: loadFont('baloo-2', 'baloo-2-latin-800-normal.woff'),
  bold: loadFont('baloo-2', 'baloo-2-latin-700-normal.woff'),
  semibold: loadFont('baloo-2', 'baloo-2-latin-600-normal.woff'),
  // Nunito: textos y descripciones
  texto: loadFont('nunito', 'nunito-latin-600-normal.woff'),
  textoBold: loadFont('nunito', 'nunito-latin-800-normal.woff'),
  // Pacifico: frases de brocha en la carta ("¡Del mar a tu mesa!")
  script: loadFont('pacifico', 'pacifico-latin-400-normal.woff'),
};

// Serializador propio: Path.toPathData() de opentype.js 2.0 voltea cada glifo
// (flipY por defecto) y a veces emite NaN al optimizar. Aquí no se transforma nada.
const n = (v) => {
  if (!Number.isFinite(v)) throw new Error(`Coordenada inválida en glifo: ${v}`);
  return String(Math.round(v * 100) / 100);
};
function serialize(commands) {
  return commands
    .map((c) => {
      switch (c.type) {
        case 'M': case 'L': return `${c.type}${n(c.x)} ${n(c.y)}`;
        case 'Q': return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
        case 'C': return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
        case 'Z': return 'Z';
        default: throw new Error(`Comando de trazo desconocido: ${c.type}`);
      }
    })
    .join('');
}

/**
 * Traza una línea de texto. Devuelve el path SVG, su ancho y la caja vertical.
 * tracking: espaciado extra en milésimas de em (como en Figma/Illustrator).
 * max: ancho máximo; si el texto no cabe, se reduce el tamaño hasta que quepa.
 */
export function textPath(font, text, opts = {}) {
  const { max = Infinity, ...rest } = opts;
  const first = layoutText(font, text, rest);
  if (first.width <= max) return first;
  return layoutText(font, text, { ...rest, size: (rest.size ?? 100) * (max / first.width) });
}

function layoutText(font, text, { x = 0, y = 0, size = 100, tracking = 0, align = 'left' } = {}) {
  // charToGlyph letra por letra: stringToGlyphs aplica sustituciones GSUB que
  // opentype.js no soporta en Nunito (lookupType 6, formato 2) y lanza error.
  const glyphs = Array.from(text.normalize('NFC'), (c) => font.charToGlyph(c));
  const scale = size / font.unitsPerEm;
  const extra = (tracking / 1000) * size;
  let width = 0;
  const advances = glyphs.map((g, i) => {
    // getKerningValue puede devolver undefined en pares sin kerning: forzar a 0 para no propagar NaN.
    const kern = (i < glyphs.length - 1 ? font.getKerningValue(g, glyphs[i + 1]) : 0) || 0;
    const adv = (g.advanceWidth + kern) * scale + (i < glyphs.length - 1 ? extra : 0);
    width += adv;
    return adv;
  });
  let cursor = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
  const d = glyphs
    .map((g, i) => {
      const p = serialize(g.getPath(cursor, y, size).commands);
      cursor += advances[i];
      return p;
    })
    .join('');
  const ascent = (font.tables.os2.sCapHeight || font.ascender * 0.7) * scale;
  return { d, width, ascent, size };
}
