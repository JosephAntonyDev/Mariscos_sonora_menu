// Imágenes de la carta generadas en el build a partir de src/data/menu.ts.
import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { ARCHIVOS, renderCarta } from '../../lib/carta-imagen';

export const getStaticPaths = (() =>
  ARCHIVOS.map((a) => ({ params: { archivo: a.archivo }, props: a }))) satisfies GetStaticPaths;

type Props = (typeof ARCHIVOS)[number];

export const GET: APIRoute<Props> = async ({ props, site }) => {
  const host = (site ?? new URL('https://elchiapasonora.vercel.app')).host;
  const png = await renderCarta(props.formato, props.tema, host);
  const body = props.vista ? await sharp(png).resize({ width: 360 }).webp({ quality: 82 }).toBuffer() : png;
  return new Response(new Uint8Array(body), {
    headers: { 'Content-Type': props.vista ? 'image/webp' : 'image/png' },
  });
};
