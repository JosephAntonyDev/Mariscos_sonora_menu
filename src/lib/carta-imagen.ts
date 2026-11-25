/**
 * Genera las imágenes de la carta (PNG para WhatsApp / redes) a partir de
 * src/data/menu.ts y src/data/negocio.ts. Se ejecuta en cada build de Vercel
 * desde src/pages/descargas/[archivo].ts, así que al cambiar un precio las
 * imágenes se actualizan solas. El texto se convierte en trazos (no depende de
 * fuentes instaladas en el servidor).
 */
import sharp from 'sharp';
import { COLOR, FONT, r, textPath } from '../../scripts/brand-kit.mjs';
import { categoriasVisibles, precio, type Categoria, type Etiqueta, type Platillo } from '../data/menu';
import { negocio } from '../data/negocio';
import { horarioAgrupado } from './horario';

export type Formato = 'estados' | 'post';
export type Tema = 'arena' | 'mar';

export const FORMATOS: Record<Formato, { w: number; h: number; columnas: number; nombre: string; detalle: string }> = {
  estados: { w: 1080, h: 1920, columnas: 1, nombre: 'Estados e historias', detalle: '1080 × 1920 px · WhatsApp, Instagram y Facebook' },
  post: { w: 1080, h: 1350, columnas: 2, nombre: 'Publicación', detalle: '1080 × 1350 px · Feed de Instagram y Facebook' },
};
export const TEMAS: Record<Tema, string> = { arena: 'Arena', mar: 'Mar' };

interface Paleta {
  tinta: string; suave: string; acento: string; titulo: string; linea: string; puntos: string;
  banda: string; bandaTinta: string; bandaAcento: string; bandaSuave: string;
}
const PALETAS: Record<Tema, Paleta> = {
  arena: {
    tinta: COLOR.cafe, suave: '#6B4C3B', acento: '#B8400E', titulo: COLOR.mar, linea: '#D9C6AB', puntos: '#B9A487',
    banda: COLOR.mar, bandaTinta: '#FFFFFF', bandaAcento: COLOR.oroClaro, bandaSuave: '#CFE3E2',
  },
  mar: {
    // Mezclas sólidas de blanco sobre #0E4A57 (librsvg no siempre respeta rgba en trazos)
    tinta: '#FFFFFF', suave: '#C9DEDD', acento: COLOR.oroClaro, titulo: COLOR.oroClaro, linea: '#4A7781', puntos: '#7FA0A7',
    banda: '#072E37', bandaTinta: '#FFFFFF', bandaAcento: COLOR.oroClaro, bandaSuave: '#B9CFCF',
  },
};
const PILDORAS: Partial<Record<Etiqueta, { fondo: string; tinta: string; texto: string }>> = {
  nuevo: { fondo: COLOR.camaron, tinta: '#FFFFFF', texto: 'NUEVO' },
  'tiempo-limitado': { fondo: COLOR.oroClaro, tinta: COLOR.cafe, texto: 'POR TIEMPO LIMITADO' },
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
  if (out.length > lineas) {
    const resto = out.slice(lineas - 1).join(' ');
    return [...out.slice(0, lineas - 1), resto]; // la última línea se ajusta con `max`
  }
  return out;
}

interface Bloque { alto: number; dibujar: (x: number, y: number) => string }

/** Bloque de una categoría: título + platillos, en una columna de ancho `w`. */
function bloqueCategoria(cat: Categoria, w: number, p: Paleta): Bloque {
  const ops: ((x: number, y: number) => string)[] = [];
  let y = 0;

  // Título de la categoría
  const tituloY = y + 34;
  ops.push((x, oy) => path(textPath(FONT.extrabold, cat.nombre, { x, y: oy + tituloY, size: 42, max: w }).d, p.titulo));
  ops.push((x, oy) => `<rect x="${x}" y="${oy + tituloY + 14}" width="${w}" height="3" rx="1.5" fill="${p.titulo}"/>`);
  y = tituloY + 14 + 3 + 26;

  const lider = (x1: number, x2: number, yl: number) =>
    x2 - x1 > 24
      ? `<line x1="${x1 + 10}" y1="${yl}" x2="${x2 - 10}" y2="${yl}" stroke="${p.puntos}" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 11"/>`
      : '';

  cat.platillos.forEach((pl: Platillo, i) => {
    if (i > 0) y += 22;
    const unico = pl.precios.length === 1;
    const lineaY = y + 32;

    // Precio (si es único) a la derecha
    const precioTxt = unico ? precio(pl.precios[0].monto) : '';
    const precioW = unico ? textPath(FONT.extrabold, precioTxt, { size: 40 }).width : 0;

    // Píldoras de etiqueta
    const pildoras = (pl.etiquetas ?? []).map((e) => PILDORAS[e]).filter(Boolean) as NonNullable<(typeof PILDORAS)[Etiqueta]>[];
    const pildorasW = pildoras.reduce((n, pi) => n + textPath(FONT.textoBold, pi.texto, { size: 15, tracking: 80 }).width + 22 + 10, 0);

    // Si nombre + etiquetas + precio no caben en una línea, las etiquetas bajan.
    const reservaPrecio = unico ? precioW + 70 : 0;
    const nombreNatural = textPath(FONT.bold, pl.nombre, { size: 37 }).width;
    const pildorasAbajo = pildoras.length > 0 && nombreNatural + 12 + pildorasW + reservaPrecio > w;
    const nombreMax = w - reservaPrecio - (pildorasAbajo ? 0 : pildorasW);
    const nombre = textPath(FONT.bold, pl.nombre, { size: 37, max: nombreMax });
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
        const r = dibujarPildoras(cx, oy + lineaY);
        s += r.s;
        cx = r.fin;
      }
      if (unico) {
        s += lider(cx, x + w - precioW, oy + lineaY - 4);
        s += path(textPath(FONT.extrabold, precioTxt, { x: x + w, y: oy + lineaY + 1, size: 40, align: 'right' }).d, p.acento);
      }
      return s;
    });
    y = lineaY + 8;
    if (pildorasAbajo) {
      const py = y + 32;
      ops.push((x, oy) => dibujarPildoras(x, oy + py).s);
      y = py + 4;
    }

    // Descripción (o ingredientes) en máximo 2 líneas
    const desc = pl.ingredientes?.length ? pl.ingredientes.join(' · ') : pl.descripcion;
    if (desc) {
      const lineas = envolver(FONT.texto, desc, 25, w, w < 600 ? 3 : 2);
      lineas.forEach((l, k) => {
        const ly = y + 28 + k * 33;
        ops.push((x, oy) => path(textPath(FONT.texto, l, { x, y: oy + ly, size: 25, max: w }).d, p.suave));
      });
      y += 28 + (lineas.length - 1) * 33 + 6;
    }

    // Presentaciones con su propio precio
    if (!unico) {
      for (const pr of pl.precios) {
        const vy = y + 40;
        const etiqueta = pr.presentacion ?? '';
        const txt = precio(pr.monto);
        ops.push((x, oy) => {
          const e = textPath(FONT.textoBold, etiqueta, { x: x + 26, y: oy + vy, size: 28 });
          const pw = textPath(FONT.extrabold, txt, { size: 36 }).width;
          return (
            `<circle cx="${x + 9}" cy="${oy + vy - 9}" r="5" fill="${p.acento}"/>` +
            path(e.d, p.tinta) +
            lider(x + 26 + e.width, x + w - pw, oy + vy - 4) +
            path(textPath(FONT.extrabold, txt, { x: x + w, y: oy + vy + 1, size: 36, align: 'right' }).d, p.acento)
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
  const W = F.w, H = F.h, M = 72;
  const estados = formato === 'estados';
  const logoSize = estados ? 300 : 186;
  const bandaH = estados ? 262 : 196;

  let svg = '';
  // Fondo
  if (tema === 'mar') {
    svg += `<defs><linearGradient id="g" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="${COLOR.marClaro}"/><stop offset=".55" stop-color="${COLOR.mar}"/><stop offset="1" stop-color="#0A3540"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>`;
  } else {
    svg += `<rect width="${W}" height="${H}" fill="${COLOR.arena}"/><rect x="28" y="28" width="${W - 56}" height="${H - 56 - bandaH + 28}" rx="18" fill="none" stroke="${p.linea}" stroke-width="2"/>`;
  }

  // Encabezado
  let contenidoY: number;
  let logo: { left: number; top: number };
  if (estados) {
    logo = { left: (W - logoSize) / 2, top: 70 };
    svg += path(textPath(FONT.textoBold, 'NUESTRA CARTA', { x: W / 2, y: 428, size: 24, tracking: 320, align: 'center' }).d, p.acento);
    svg += path(textPath(FONT.extrabold, '¿Qué se te antoja?', { x: W / 2, y: 500, size: 66, align: 'center' }).d, p.titulo);
    contenidoY = 560;
  } else {
    logo = { left: M - 8, top: 56 };
    const tx = M + logoSize + 22;
    svg += path(textPath(FONT.textoBold, 'NUESTRA CARTA', { x: tx, y: 128, size: 22, tracking: 300 }).d, p.acento);
    svg += path(textPath(FONT.extrabold, '¿Qué se te antoja?', { x: tx, y: 196, size: 62, max: W - tx - M }).d, p.titulo);
    svg += path(textPath(FONT.texto, negocio.nombre, { x: tx, y: 236, size: 26, max: W - tx - M }).d, p.suave);
    contenidoY = 280;
  }

  // Carta: columnas escaladas para que siempre quepa, cambie lo que cambie el menú
  const gap = estados ? 34 : 30;
  const colGap = 56;
  const anchoUtil = W - 2 * M;
  const colW = (anchoUtil - colGap * (F.columnas - 1)) / F.columnas;
  const bloques = categoriasVisibles.map((c) => bloqueCategoria(c, colW, p));
  const cols = repartir(bloques, F.columnas, gap);
  const altoCol = Math.max(...cols.map((c) => c.reduce((n, b) => n + b.alto, 0) + gap * (c.length - 1)));
  const disponible = H - bandaH - contenidoY - (estados ? 50 : 40);
  const s = Math.min(1, disponible / altoCol);
  const ox = M + (anchoUtil - anchoUtil * s) / 2;
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

  // Banda inferior: pedidos, horario, entrega y ubicación
  const by = H - bandaH;
  const horario = horarioAgrupado(negocio.horario).map((g) => `${g.dias} ${g.horas.charAt(0).toLowerCase()}${g.horas.slice(1)}`).join(' · ');
  svg += `<rect x="0" y="${by}" width="${W}" height="${bandaH}" fill="${p.banda}"/>`;
  svg += `<path d="M0 ${by} C ${W * 0.25} ${by - 18} ${W * 0.5} ${by + 14} ${W * 0.75} ${by - 6} S ${W} ${by - 10} ${W} ${by} Z" fill="${p.banda}"/>`;
  if (estados) {
    svg += path(textPath(FONT.textoBold, 'PEDIDOS POR WHATSAPP O LLAMADA', { x: M, y: by + 58, size: 22, tracking: 200 }).d, p.bandaAcento);
    svg += path(textPath(FONT.textoBold, host, { x: W - M, y: by + 58, size: 22, align: 'right', max: 330 }).d, p.bandaSuave);
    svg += path(textPath(FONT.extrabold, negocio.telefono.visible, { x: M, y: by + 128, size: 72 }).d, p.bandaTinta);
    svg += path(textPath(FONT.texto, horario, { x: M, y: by + 176, size: 26, max: anchoUtil }).d, p.bandaTinta);
    svg += path(textPath(FONT.texto, `${negocio.domicilio.nota}`, { x: M, y: by + 212, size: 24, max: anchoUtil }).d, p.bandaSuave);
    svg += path(textPath(FONT.texto, `${negocio.direccion.linea}, ${negocio.direccion.ciudad}`, { x: M, y: by + 244, size: 24, max: anchoUtil }).d, p.bandaSuave);
  } else {
    svg += path(textPath(FONT.textoBold, 'PEDIDOS', { x: M, y: by + 52, size: 20, tracking: 220 }).d, p.bandaAcento);
    svg += path(textPath(FONT.textoBold, host, { x: W - M, y: by + 52, size: 20, align: 'right', max: 360 }).d, p.bandaSuave);
    svg += path(textPath(FONT.extrabold, negocio.telefono.visible, { x: M, y: by + 112, size: 60 }).d, p.bandaTinta);
    svg += path(textPath(FONT.texto, horario, { x: M, y: by + 150, size: 23, max: anchoUtil }).d, p.bandaTinta);
    svg += path(textPath(FONT.texto, `Servicio a domicilio con costo extra · ${negocio.direccion.linea}`, { x: M, y: by + 180, size: 21, max: anchoUtil }).d, p.bandaSuave);
  }

  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>${esc(negocio.nombre)}</title>${svg}</svg>`;
  const logoBuf = await sharp(r('src/assets/brand/logo-insignia.png')).resize(logoSize, logoSize).png().toBuffer();
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
