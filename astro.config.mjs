// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// URL pública definitiva (dominio propio o la de Vercel). Se usa para las etiquetas
// Open Graph y el sitemap. En Vercel se toma automáticamente si no se define SITE_URL.
const site =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://mariscos-sonora-menu.vercel.app');

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'always' },
  integrations: [react()],
  // La barra de desarrollo de Astro tapa la barra flotante del pedido en móvil.
  devToolbar: { enabled: false },
});
