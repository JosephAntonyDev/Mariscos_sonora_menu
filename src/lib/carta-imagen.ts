/**
 * Genera las imágenes de la carta (PNG para WhatsApp / redes) a partir de
 * src/data/menu.ts y src/data/negocio.ts, con estilo de marisquería: papel
 * picado, letrero de madera, marco de cuerda y olas. Se ejecuta en cada build
 * de Vercel desde src/pages/descargas/[archivo].ts, así que al cambiar un precio
 * las imágenes se actualizan solas. El texto se convierte en trazos (no depende
 * de fuentes instaladas en el servidor).
 */
import sharp from 'sharp';
import { FONT, r, textPath } from '../../scripts/brand-kit.mjs';
import { categoriasVisibles, precio, type Categoria, type Etiqueta, type Platillo } from '../data/menu';
import { negocio } from '../data/negocio';
import { horarioAgrupado } from './horario';
import { ICONOS_CATEGORIA, MARISQUERO as M, letreroMadera, olas, papelPicado, patronCuerda } from './decoracion';

export type Formato = 'estados' | 'post';
export type Tema = 'arena' | 'mar';

export const FORMATOS: Record<Formato, { w: number; h: number; columnas: number; nombre: string; detalle: string }> = {
  estados: { w: 1080, h: 1920, columnas: 1, nombre: 'Estados e historias', detalle: '1080 × 1920 px · WhatsApp, Instagram y Facebook' },
  post: { w: 1080, h: 1350, columnas: 2, nombre: 'Publicación', detalle: '1080 × 1350 px · Feed de Instagram y Facebook' },
};
/** "arena" = hoja de papel sobre el mar; "mar" = todo sobre el mar turquesa. */
export const TEMAS: Record<Tema, string> = { arena: 'Playa', mar: 'Mar' };

interface Paleta {
  tinta: string; suave: string; acento: string; titulo: string; puntos: string;
  burbuja: string; subrayado: string; script: string;
}
const PALETAS: Record<Tema, Paleta> = {
  arena: {
    tinta: M.cafe, suave: '#6B4C3B', acento: '#B8400E', titulo: M.marProfundo, puntos: '#E9A27A',
    burbuja: M.turquesa, subrayado: M.coral, script: M.coral,
  },
  mar: {
    tinta: '#FFFFFF', suave: '#D3ECEC', acento: M.amarillo, titulo: '#FFFFFF', puntos: '#8FD3D8',
    burbuja: M.coral, subrayado: M.amarillo, script: M.amarillo,
  },
};
const PILDORAS: Partial<Record<Etiqueta, { fondo: string; tinta: string; texto: string }>> = {
  nuevo: { fondo: M.coral, tinta: '#FFFFFF', texto: 'NUEVO' },
  'tiempo-limitado': { fondo: M.amarillo, tinta: M.cafe, texto: 'POR TIEMPO LIMITADO' },
};

const esc = (s: string) => s.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`);
const path = (d: string, fill: string) => (d ? `<path d="${d}" fill="${fill}"/>` : '');

/** Corta un texto en líneas que quepan en `max` px (sin reducir el tamaño). */
function envolver(font: Parameters<typeof textPath>[0], texto: string, size: number, max: number, lineas = 2) {
  const palabras = texto.split(/\s+/);
  const out: string[] = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (textPath(font, prueba, { size }).width <= max || !actual) actual = prueba;
    else {
      out.push(actual);
      actual = p;
    }
  }
  if (actual) out.push(actual);
  if (out.length > lineas) return [...out.slice(0, lineas - 1), out.slice(lineas - 1).join(' ')];
  return out;
}

/** Línea ondulada (como el subrayado de la carta web). */
function onda(x: number, y: number, w: number, color: string, amp = 4, paso = 24) {
  let d = `M${x} ${y}`;
  for (let i = 0; i * paso < w; i++) d += `q${paso / 4} ${i % 2 ? amp : -amp} ${paso / 2} 0t${paso / 2} 0`;
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round"/>`;
}

interface Bloque { alto: number; dibujar: (x: number, y: number) => string }

/** Bloque de una categoría: ícono + título ondulado + platillos, en una columna de ancho `w`. */
function bloqueCategoria(cat: Categoria, w: number, p: Paleta): Bloque {
  const ops: ((x: number, y: number) => string)[] = [];
  let y = 0;

  // Burbuja con ícono + título + subrayado ondulado
  const tituloY = 40;
  const icono = ICONOS_CATEGORIA[cat.icono ?? 'pez'];
  ops.push((x, oy) => {
    const cx = x + 26, cy = oy + tituloY - 13;
    return (
      `<circle cx="${cx}" cy="${cy + 3}" r="26" fill="#000" opacity=".15"/>` +
      `<circle cx="${cx}" cy="${cy}" r="26" fill="${p.burbuja}"/>` +
      `<g transform="translate(${cx - 15} ${cy - 15}) scale(1.25)"><path d="${icono}" fill="none" stroke="#FFFFFF" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></g>` +
      path(textPath(FONT.extrabold, cat.nombre, { x: x + 66, y: oy + tituloY, size: 42, max: w - 66 }).d, p.titulo)
    );
  });
  ops.push((x, oy) => onda(x, oy + tituloY + 24, w, p.subrayado));
  y = tituloY + 24 + 30;

  const lider = (x1: number, x2: number, yl: number) =>
    x2 - x1 > 24
      ? `<line x1="${x1 + 10}" y1="${yl}" x2="${x2 - 10}" y2="${yl}" stroke="${p.puntos}" stroke-width="4" stroke-linecap="round" stroke-dasharray="0.1 11"/>`
      : '';

  cat.platillos.forEach((pl: Platillo, i) => {
    if (i > 0) y += 22;
    const unico = pl.precios.length === 1;
    const lineaY = y + 32;
    const precioTxt = unico ? precio(pl.precios[0].monto) : '';
    const precioW = unico ? textPath(FONT.extrabold, precioTxt, { size: 42 }).width : 0;

    const pildoras = (pl.etiquetas ?? []).map((e) => PILDORAS[e]).filter(Boolean) as NonNullable<(typeof PILDORAS)[Etiqueta]>[];
    const pildorasW = pildoras.reduce((n, pi) => n + textPath(FONT.textoBold, pi.texto, { size: 15, tracking: 80 }).width + 22 + 10, 0);

    // Si nombre + etiquetas + precio no caben en una línea, las etiquetas bajan.
    const reservaPrecio = unico ? precioW + 70 : 0;
    const nombreNatural = textPath(FONT.bold, pl.nombre, { size: 37 }).width;
    const pildorasAbajo = pildoras.length > 0 && nombreNatural + 12 + pildorasW + reservaPrecio > w;
    const nombre = textPath(FONT.bold, pl.nombre, { size: 37, max: w - reservaPrecio - (pildorasAbajo ? 0 : pildorasW) });
    const dibujarPildoras = (x0: number, yb: number) => {
      let s = '';
      let cx = x0;
      for (const pi of pildoras) {
        const t = textPath(FONT.textoBold, pi.texto, { size: 15, tracking: 80 });
        s += `<rect x="${cx}" y="${yb - 25}" width="${t.width + 22}" height="28" rx="8" fill="${pi.fondo}"/>`;
        s += path(textPath(FONT.textoBold, pi.texto, { x: cx + 11, y: yb - 6, size: 15, tracking: 80 }).d, pi.tinta);
        cx += t.width + 22 + 10;
      }
      return { s, fin: cx };
    };
    ops.push((x, oy) => {
      let s = path(textPath(FONT.bold, pl.nombre, { x, y: oy + lineaY, size: nombre.size }).d, p.tinta);
      let cx = x + nombre.width + 12;
      if (!pildorasAbajo) {
        const res = dibujarPildoras(cx, oy + lineaY);
        s += res.s;
        cx = res.fin;
      }
      if (unico) {
        s += lider(cx, x + w - precioW, oy + lineaY - 4);
        s += path(textPath(FONT.extrabold, precioTxt, { x: x + w, y: oy + lineaY + 2, size: 42, align: 'right' }).d, p.acento);
      }
      return s;
    });
    y = lineaY + 8;
    if (pildorasAbajo) {
      const py = y + 32;
      ops.push((x, oy) => dibujarPildoras(x, oy + py).s);
      y = py + 4;
    }

    const desc = pl.ingredientes?.length ? pl.ingredientes.join(' · ') : pl.descripcion;
    if (desc) {
      const lineas = envolver(FONT.texto, desc, 25, w, w < 600 ? 3 : 2);
      lineas.forEach((l, k) => {
        const ly = y + 28 + k * 33;
        ops.push((x, oy) => path(textPath(FONT.texto, l, { x, y: oy + ly, size: 25, max: w }).d, p.suave));
      });
      y += 28 + (lineas.length - 1) * 33 + 6;
    }

    if (!unico) {
      for (const pr of pl.precios) {
        const vy = y + 40;
        const etiqueta = pr.presentacion ?? '';
        const txt = precio(pr.monto);
        ops.push((x, oy) => {
          const e = textPath(FONT.textoBold, etiqueta, { x: x + 26, y: oy + vy, size: 28 });
          const pw = textPath(FONT.extrabold, txt, { size: 38 }).width;
          return (
            `<circle cx="${x + 9}" cy="${oy + vy - 9}" r="7" fill="${p.burbuja}"/>` +
            path(e.d, p.tinta) +
            lider(x + 26 + e.width, x + w - pw, oy + vy - 4) +
            path(textPath(FONT.extrabold, txt, { x: x + w, y: oy + vy + 2, size: 38, align: 'right' }).d, p.acento)
          );
        });
        y = vy + 6;
      }
    }
  });

  return { alto: y, dibujar: (x, oy) => ops.map((op) => op(x, oy)).join('') };
}

/** Reparte las categorías en columnas lo más parejas posible (sin partir categorías). */
function repartir(bloques: Bloque[], columnas: number, gap: number) {
  if (columnas === 1) return [bloques];
  let mejor: Bloque[][] = [bloques, []];
  let mejorAlto = Infinity;
  for (let i = 1; i < bloques.length; i++) {
    const a = bloques.slice(0, i), b = bloques.slice(i);
    const alto = Math.max(...[a, b].map((c) => c.reduce((n, bl) => n + bl.alto, 0) + gap * (c.length - 1)));
    if (alto < mejorAlto) { mejorAlto = alto; mejor = [a, b]; }
  }
  return mejor;
}

export async function renderCarta(formato: Formato, tema: Tema, host: string): Promise<Buffer> {
  const F = FORMATOS[formato];
  const p = PALETAS[tema];
  const W = F.w, H = F.h;
  const estados = formato === 'estados';
  const hoja = tema === 'arena';
  const bandaH = estados ? 270 : 200;
  const picadoAlto = estados ? 128 : 92;
  const margen = 40; // borde de la hoja
  const M2 = estados ? 96 : 84; // margen del contenido

  let svg = `<defs>${patronCuerda('cuerda')}<linearGradient id="mar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${M.turquesaClaro}"/><stop offset=".45" stop-color="${M.turquesa}"/><stop offset="1" stop-color="${M.marProfundo}"/></linearGradient></defs>`;
  svg += `<rect width="${W}" height="${H}" fill="url(#mar)"/>`;
  // Textura de olitas
  for (let yy = 40; yy < H; yy += 46) {
    for (let xx = (yy / 46) % 2 ? 0 : 30; xx < W; xx += 60) {
      svg += `<path d="M${xx} ${yy}q15 -10 30 0" fill="none" stroke="#FFFFFF" stroke-opacity=".07" stroke-width="3"/>`;
    }
  }

  // Hoja de papel con marco de cuerda
  const hojaTop = picadoAlto * 0.62;
  const hojaBottom = H - bandaH + 40;
  if (hoja) {
    svg += `<rect x="${margen}" y="${hojaTop + 10}" width="${W - margen * 2}" height="${hojaBottom - hojaTop}" rx="30" fill="#000" opacity=".2"/>`;
    svg += `<rect x="${margen}" y="${hojaTop}" width="${W - margen * 2}" height="${hojaBottom - hojaTop}" rx="30" fill="${M.arena}" stroke="url(#cuerda)" stroke-width="14"/>`;
  }

  // Papel picado arriba
  // En el tema Mar se omite el turquesa para que ninguna bandera se pierda en el fondo.
  const coloresPicado = hoja ? undefined : [M.coral, M.amarillo, M.rosa, M.lima, '#FFFFFF'];
  svg += `<g transform="translate(${margen / 2} 0)">${papelPicado(W - margen, estados ? 8 : 9, picadoAlto, 8, coloresPicado)}</g>`;

  // Encabezado: logo + letrero de madera + frase de brocha
  let contenidoY: number;
  let logo: { left: number; top: number; size: number };
  const letreroTexto = (cx: number, cy: number, size: number) => {
    const t = textPath(FONT.extrabold, 'NUESTRO MENÚ', { x: cx, y: cy, size, tracking: 30, align: 'center' });
    return `<path d="${t.d}" fill="#FFFFFF" stroke="${M.maderaOscura}" stroke-width="${size * 0.1}" stroke-linejoin="round" paint-order="stroke"/>`;
  };
  if (estados) {
    logo = { size: 240, left: (W - 240) / 2, top: picadoAlto + 22 };
    const ly = logo.top + logo.size + 18;
    svg += letreroMadera(W / 2 - 320, ly, 640, 108, 'madera');
    svg += letreroTexto(W / 2, ly + 76, 64);
    svg += path(textPath(FONT.script, '¡Del mar a tu mesa!', { x: W / 2, y: ly + 108 + 74, size: 46, align: 'center' }).d, p.script);
    contenidoY = ly + 108 + 112;
  } else {
    logo = { size: 176, left: M2 - 10, top: picadoAlto + 8 };
    const lx = M2 + 186;
    const lw = W - M2 - lx;
    svg += letreroMadera(lx, picadoAlto + 30, lw, 92, 'madera');
    svg += letreroTexto(lx + lw / 2, picadoAlto + 30 + 64, 54);
    svg += path(textPath(FONT.script, '¡Del mar a tu mesa!', { x: lx + lw / 2, y: picadoAlto + 30 + 92 + 54, size: 34, align: 'center' }).d, p.script);
    contenidoY = picadoAlto + 30 + 92 + 82;
  }

  // Carta en columnas, escalada para que siempre quepa
  const gap = estados ? 34 : 28;
  const colGap = 56;
  const anchoUtil = W - 2 * M2;
  const colW = (anchoUtil - colGap * (F.columnas - 1)) / F.columnas;
  const bloques = categoriasVisibles.map((c) => bloqueCategoria(c, colW, p));
  const cols = repartir(bloques, F.columnas, gap);
  const altoCol = Math.max(...cols.map((c) => c.reduce((n, b) => n + b.alto, 0) + gap * (c.length - 1)));
  const disponible = hojaBottom - 60 - contenidoY;
  const s = Math.min(1, disponible / altoCol);
  const ox = M2 + (anchoUtil - anchoUtil * s) / 2;
  let carta = '';
  cols.forEach((c, i) => {
    let y = 0;
    const x = i * (colW + colGap);
    for (const b of c) {
      carta += b.dibujar(x, y);
      y += b.alto + gap;
    }
  });
  svg += `<g transform="translate(${ox} ${contenidoY}) scale(${s})">${carta}</g>`;

  // Banda inferior con olas: pedidos, horario, entrega y ubicación
  const by = H - bandaH;
  svg += `<rect x="0" y="${by + 20}" width="${W}" height="${bandaH}" fill="${M.marProfundo}"/>`;
  svg += olas(W, by - 22, 64, M.turquesaClaro, M.marProfundo, 12);
  const horario = horarioAgrupado(negocio.horario).map((g) => `${g.dias} ${g.horas.charAt(0).toLowerCase()}${g.horas.slice(1)}`).join(' · ');
  const X = 64, util = W - 2 * X;
  if (estados) {
    svg += path(textPath(FONT.textoBold, 'PEDIDOS POR WHATSAPP O LLAMADA', { x: X, y: by + 74, size: 22, tracking: 200 }).d, M.amarillo);
    svg += path(textPath(FONT.textoBold, host, { x: W - X, y: by + 74, size: 22, align: 'right', max: 330 }).d, '#BFE3E3');
    svg += path(textPath(FONT.extrabold, negocio.telefono.visible, { x: X, y: by + 144, size: 72 }).d, '#FFFFFF');
    svg += path(textPath(FONT.texto, horario, { x: X, y: by + 190, size: 26, max: util }).d, '#FFFFFF');
    svg += path(textPath(FONT.texto, negocio.domicilio.nota, { x: X, y: by + 226, size: 24, max: util }).d, '#BFE3E3');
    svg += path(textPath(FONT.texto, `${negocio.direccion.linea}, ${negocio.direccion.ciudad}`, { x: X, y: by + 258, size: 24, max: util }).d, '#BFE3E3');
  } else {
    svg += path(textPath(FONT.textoBold, 'PEDIDOS', { x: X, y: by + 66, size: 20, tracking: 220 }).d, M.amarillo);
    svg += path(textPath(FONT.textoBold, host, { x: W - X, y: by + 66, size: 20, align: 'right', max: 360 }).d, '#BFE3E3');
    svg += path(textPath(FONT.extrabold, negocio.telefono.visible, { x: X, y: by + 124, size: 58 }).d, '#FFFFFF');
    svg += path(textPath(FONT.texto, horario, { x: X, y: by + 160, size: 22, max: util }).d, '#FFFFFF');
    svg += path(textPath(FONT.texto, `Servicio a domicilio con costo extra · ${negocio.direccion.linea}`, { x: X, y: by + 188, size: 20, max: util }).d, '#BFE3E3');
  }

  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>${esc(negocio.nombre)}</title>${svg}</svg>`;
  const logoBuf = await sharp(r('src/assets/brand/logo-insignia.png')).resize(logo.size, logo.size).png().toBuffer();
  return sharp(Buffer.from(doc))
    .composite([{ input: logoBuf, left: Math.round(logo.left), top: Math.round(logo.top) }])
    .png({ compressionLevel: 9, palette: true, quality: 95, effort: 8 })
    .toBuffer();
}

/** Lista de archivos que se publican en /descargas. */
export const ARCHIVOS = (Object.keys(FORMATOS) as Formato[]).flatMap((formato) =>
  (Object.keys(TEMAS) as Tema[]).flatMap((tema) => [
    { archivo: `carta-${formato}-${tema}.png`, formato, tema, vista: false },
    { archivo: `carta-${formato}-${tema}-vista.webp`, formato, tema, vista: true },
  ]),
);
