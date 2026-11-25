// Recorta las fotos de los platillos desde los flyers originales (brand/source).
// Uso: npm run photos  → escribe src/assets/fotos/*.png (Astro las optimiza a AVIF/WebP).
//
// Cuando tengan fotos reales de los platillos, basta con reemplazar los archivos de
// src/assets/fotos/ con el mismo nombre (o cambiar la ruta en src/data/menu.ts).
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { r } from './brand-kit.mjs';

// Regiones medidas sobre cada flyer, en píxeles de la imagen original.
const CROPS = {
  naranjera: { src: 'flyer-naranjera.webp', left: 228, top: 292, width: 470, height: 436 },
  arreglada: { src: 'flyer-arreglada.webp', left: 160, top: 400, width: 580, height: 315 },
  ceviche: { src: 'flyer-bebidas.webp', left: 392, top: 628, width: 504, height: 420 },
  aguachile: { src: 'flyer-menu.webp', left: 12, top: 1066, width: 332, height: 256 },
};

await fs.mkdir(r('src/assets/fotos'), { recursive: true });
for (const [name, c] of Object.entries(CROPS)) {
  await sharp(r('brand/source', c.src))
    .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
    .png()
    .toFile(r('src/assets/fotos', `${name}.png`));
}
console.log(`Fotos recortadas: ${Object.keys(CROPS).join(', ')}`);
