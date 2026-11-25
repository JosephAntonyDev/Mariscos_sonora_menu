// Genera el kit de marca a partir del logo original (brand/source/logo-original.webp).
// Uso: npm run brand
//
// Salidas:
//  - src/assets/brand/logo-insignia.png   → maestro que Astro optimiza para la web
//  - public/marca/**                      → kit descargable (PNG, WebP, SVG, ICO)
//  - public/*.png, favicon.ico            → íconos de navegador, iOS y Android
import fs from 'node:fs/promises';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { r, COLOR, FONT, textPath } from './brand-kit.mjs';

const SRC = r('brand/source/logo-original.webp');
// Elipse que delimita la moneda dentro de la imagen original (1290 × 1282 px).
// Se mide un píxel hacia adentro para no arrastrar el fondo de playa.
const COIN = { cx: 646, cy: 627, rx: 599, ry: 611 };
const MASTER = 1240; // lienzo cuadrado del maestro

const out = (...p) => r('public/marca', ...p);
await Promise.all(
  ['png', 'webp', 'svg', 'iconos'].map((d) => fs.mkdir(out(d), { recursive: true })),
);
await fs.mkdir(r('src/assets/brand'), { recursive: true });

// 1) Maestro: moneda recortada con fondo transparente, centrada en un cuadrado.
const meta = await sharp(SRC).metadata();
const mask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}"><ellipse cx="${COIN.cx}" cy="${COIN.cy}" rx="${COIN.rx}" ry="${COIN.ry}"/></svg>`,
);
const box = {
  left: COIN.cx - COIN.rx - 1,
  top: COIN.cy - COIN.ry - 1,
  width: COIN.rx * 2 + 2,
  height: COIN.ry * 2 + 2,
};
const coin = await sharp(
  await sharp(SRC).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer(),
)
  .extract(box)
  .png()
  .toBuffer();
const master = await sharp({
  create: { width: MASTER, height: MASTER, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([{ input: coin, left: Math.round((MASTER - box.width) / 2), top: Math.round((MASTER - box.height) / 2) }])
  .png({ compressionLevel: 9 })
  .toBuffer();
await fs.writeFile(r('src/assets/brand/logo-insignia.png'), master);

const resize = (size) => sharp(master).resize(size, size, { kernel: 'lanczos3' });

// 2) Logo insignia en PNG (transparente) y WebP.
for (const size of [1240, 1024, 512, 256, 128]) {
  await resize(size).png({ compressionLevel: 9 }).toFile(out('png', `logo-insignia-${size}.png`));
}
for (const size of [1024, 512]) {
  await resize(size).webp({ quality: 90, alphaQuality: 100 }).toFile(out('webp', `logo-insignia-${size}.webp`));
}

// 3) Íconos: sobre fondo sólido cuando la plataforma no admite transparencia.
const onBackground = async (size, scale, bg) => {
  const inner = Math.round(size * scale);
  const logo = await resize(inner).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
};
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const icons = {
  'apple-touch-icon.png': await onBackground(180, 0.9, COLOR.arena), // iOS rellena la transparencia de negro
  'icon-192.png': await onBackground(192, 1, transparent),
  'icon-512.png': await onBackground(512, 1, transparent),
  'icon-maskable-512.png': await onBackground(512, 0.78, COLOR.mar), // zona segura de Android (80 %)
  'favicon-32.png': await onBackground(32, 1, transparent),
};
for (const [name, raw] of Object.entries(icons)) {
  // Paleta de 256 colores con difuminado: ~70 % más ligero sin pérdida visible a tamaño ícono.
  const buf = await sharp(raw).png({ palette: true, quality: 92, effort: 10, dither: 1 }).toBuffer();
  await fs.writeFile(r('public', name), buf);
  await fs.writeFile(out('iconos', name), buf);
}
const ico = await pngToIco(await Promise.all([16, 32, 48].map((s) => onBackground(s, 1, transparent))));
await fs.writeFile(r('public/favicon.ico'), ico);
await fs.writeFile(out('iconos', 'favicon.ico'), ico);

// 4) SVG de la insignia: contenedor SVG con la ilustración original incrustada.
//    Es idéntica al original y escala en cualquier programa que acepte SVG,
//    pero la ilustración sigue siendo un mapa de bits (1024 px) por dentro.
const embedded = (await resize(1024).png({ compressionLevel: 9 }).toBuffer()).toString('base64');
await fs.writeFile(
  out('svg', 'logo-insignia.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024" role="img" aria-label="Mariscos El Chiapas Sonora"><title>Mariscos El Chiapas Sonora</title><image width="1024" height="1024" href="data:image/png;base64,${embedded}"/></svg>`,
);

// 5) Logotipo vectorial (texto trazado), en versión apilada y horizontal.
//    Imita el rótulo del logo: letras blancas con contorno café ("relieve").
const VARIANTS = {
  color: { main: COLOR.cafe, accent: COLOR.camaron, stroke: null },
  blanco: { main: COLOR.blanco, accent: COLOR.blanco, stroke: null },
  negro: { main: COLOR.negro, accent: COLOR.negro, stroke: null },
  relieve: { main: COLOR.blanco, accent: COLOR.blanco, stroke: COLOR.cafe },
};
const pathEl = (d, fill, stroke) =>
  stroke
    ? `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="14" stroke-linejoin="round" paint-order="stroke"/>`
    : `<path d="${d}" fill="${fill}"/>`;

function stacked(v) {
  const pad = v.stroke ? 16 : 4;
  const big = textPath(FONT.extrabold, 'EL CHIAPAS', { size: 200, tracking: 10 });
  const w = big.width;
  const top = textPath(FONT.extrabold, 'MARISCOS', { size: 96, tracking: 160, x: w / 2, y: 96 * 0.72, align: 'center' });
  const yBig = 72 + 18 + 200 * 0.72;
  const mid = textPath(FONT.extrabold, 'EL CHIAPAS', { size: 200, tracking: 10, x: 0, y: yBig });
  const yBot = yBig + 22 + 150 * 0.72;
  const bot = textPath(FONT.extrabold, 'SONORA', { size: 150, tracking: 90, x: w / 2, y: yBot, align: 'center' });
  const H = yBot + 40; // descendentes / acentos
  return svgDoc(w, H, pad, [pathEl(top.d, v.accent, v.stroke), pathEl(mid.d, v.main, v.stroke), pathEl(bot.d, v.main, v.stroke)]);
}
function horizontal(v) {
  const pad = v.stroke ? 16 : 4;
  const line = textPath(FONT.extrabold, 'EL CHIAPAS SONORA', { size: 150, tracking: 10 });
  const top = textPath(FONT.extrabold, 'MARISCOS', { size: 70, tracking: 420, x: 4, y: 70 * 0.72 });
  const y2 = 52 + 16 + 150 * 0.72;
  const main = textPath(FONT.extrabold, 'EL CHIAPAS SONORA', { size: 150, tracking: 10, x: 0, y: y2 });
  return svgDoc(Math.max(line.width, top.width), y2 + 34, pad, [pathEl(top.d, v.accent, v.stroke), pathEl(main.d, v.main, v.stroke)]);
}
function svgDoc(w, h, pad, els) {
  const W = Math.ceil(w + pad * 2), H = Math.ceil(h + pad * 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Mariscos El Chiapas Sonora"><title>Mariscos El Chiapas Sonora</title>${els.join('')}</svg>`;
}
const wordmarks = {};
for (const [name, v] of Object.entries(VARIANTS)) {
  wordmarks[`logotipo-apilado-${name}`] = stacked(v);
  wordmarks[`logotipo-horizontal-${name}`] = horizontal(v);
}
for (const [name, svg] of Object.entries(wordmarks)) {
  await fs.writeFile(out('svg', `${name}.svg`), svg);
  await sharp(Buffer.from(svg), { density: 200 }).resize({ width: 1600 }).png().toFile(out('png', `${name}.png`));
}
// Copia para el sitio (encabezado y pie).
await fs.writeFile(r('src/assets/brand/logotipo-horizontal-color.svg'), wordmarks['logotipo-horizontal-color']);
await fs.writeFile(r('src/assets/brand/logotipo-horizontal-blanco.svg'), wordmarks['logotipo-horizontal-blanco']);

// 6) Firma horizontal (insignia + logotipo) para membretes, encabezados y redes.
async function lockup(variant, bg, file) {
  const H = 600, logoSize = 520;
  const word = await sharp(Buffer.from(wordmarks[`logotipo-apilado-${variant}`]), { density: 300 })
    .resize({ height: 380 })
    .png()
    .toBuffer();
  const wMeta = await sharp(word).metadata();
  const W = 40 + logoSize + 50 + wMeta.width + 60;
  await sharp({ create: { width: W, height: H, channels: 4, background: bg } })
    .composite([
      { input: await resize(logoSize).png().toBuffer(), left: 40, top: (H - logoSize) / 2 },
      { input: word, left: 40 + logoSize + 50, top: Math.round((H - wMeta.height) / 2) },
    ])
    .png({ compressionLevel: 9 })
    .toFile(out('png', file));
}
await lockup('color', transparent, 'firma-horizontal-color.png');
await lockup('blanco', transparent, 'firma-horizontal-blanco.png');
await lockup('relieve', COLOR.mar, 'firma-horizontal-mar.png');

// 7) Imagen para compartir el enlace (WhatsApp, Facebook, Instagram): 1200 × 630.
{
  const W = 1200, H = 630, logoSize = 470;
  const tx = 80 + logoSize + 50;
  const t1 = textPath(FONT.extrabold, 'MARISCOS', { size: 44, tracking: 260, x: tx, y: 205 });
  const t2 = textPath(FONT.extrabold, 'EL CHIAPAS', { size: 104, tracking: 0, x: tx - 4, y: 300 });
  const t3 = textPath(FONT.extrabold, 'SONORA', { size: 104, tracking: 60, x: tx - 4, y: 392 });
  const t4 = textPath(FONT.semibold, 'Ceviches · Aguachiles · Tostadas', { size: 34, x: tx, y: 462 });
  const t5 = textPath(FONT.semibold, 'Tuxtla Gutiérrez, Chiapas', { size: 28, x: tx, y: 506 });
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${COLOR.marClaro}"/><stop offset="1" stop-color="${COLOR.mar}"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <path d="M0 560 C 200 520 400 600 600 560 S 1000 520 1200 560 V630 H0Z" fill="${COLOR.arena}" opacity=".12"/>
    <path d="M0 590 C 200 560 400 630 600 595 S 1000 560 1200 595 V630 H0Z" fill="${COLOR.arena}" opacity=".18"/>
    <path d="${t1.d}" fill="${COLOR.oroClaro}"/>
    <path d="${t2.d}${t3.d}" fill="${COLOR.blanco}" stroke="${COLOR.cafe}" stroke-width="8" stroke-linejoin="round" paint-order="stroke"/>
    <path d="${t4.d}" fill="${COLOR.oroClaro}"/>
    <path d="${t5.d}" fill="${COLOR.blanco}" opacity=".85"/>
  </svg>`;
  await sharp(Buffer.from(bg))
    .composite([{ input: await resize(logoSize).png().toBuffer(), left: 80, top: (H - logoSize) / 2 }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(r('public/og-image.jpg'));
}

console.log('Kit de marca generado en public/marca, íconos en public/ y maestro en src/assets/brand.');
