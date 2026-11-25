// Imágenes de la carta y letrero QR, generados en el build a partir de src/data.
import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { ARCHIVOS, renderCarta, renderQRMesa, type Archivo } from '../../lib/carta-imagen';

export const getStaticPaths = (() =>
  ARCHIVOS.map((a) => ({ params: { archivo: a.archivo }, props: a }))) satisfies GetStaticPaths;

export const GET: APIRoute<Archivo> = async ({ props, site }) => {
  const base = site ?? new URL('https://elchiapasonora.vercel.app');
  const urlMenu = new URL('/', base).href;
  const png =
    props.tipo === 'qr'
      ? await renderQRMesa(props.tema, urlMenu, base.host)
      : await renderCarta(props.formato, props.tema, urlMenu);
  const body = props.vista ? await sharp(png).resize({ width: 360 }).webp({ quality: 82 }).toBuffer() : png;
  return new Response(new Uint8Array(body), {
    headers: { 'Content-Type': props.vista ? 'image/webp' : 'image/png' },
  });
};
