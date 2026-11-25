# Mariscos El Chiapas Sonora · Menú digital

Menú web para pedir por WhatsApp. Hecho con **Astro + React + TypeScript**, desplegado en **Vercel**.

- El HTML del menú se genera estático (carga instantánea, buen SEO, funciona sin JavaScript).
- React solo se usa en dos "islas" interactivas: el aviso **Abierto/Cerrado** y el **carrito de pedido**.
- Las imágenes se optimizan solas a WebP con tamaños responsivos.

## Editar precios, platillos u horario

| Qué quieres cambiar | Archivo |
| --- | --- |
| Platillos, descripciones, precios, fotos, etiquetas | [`src/data/menu.ts`](src/data/menu.ts) |
| Teléfono, WhatsApp, horario, dirección, redes, pago | [`src/data/negocio.ts`](src/data/negocio.ts) |
| Colores y tipografía | [`src/styles/global.css`](src/styles/global.css) |

Guarda, haz commit y push a `main`: Vercel publica la nueva versión en ~1 minuto. La URL no cambia, así que el QR impreso sigue sirviendo.

Ejemplo, subir el aguachile a $290:

```ts
{ id: 'aguachile', nombre: 'Aguachile', precios: [{ presentacion: 'La orden', monto: 290 }] }
```

Para ocultar un platillo agotado sin borrarlo: `disponible: false`.

## Carta para imprimir y compartir (`/carta`)

[elchiapasonora.vercel.app/carta](https://elchiapasonora.vercel.app/carta) es la carta completa en una sola hoja:

- **Imprimir o PDF**: sale en una hoja tamaño carta, con un QR que lleva al menú para pedir en línea.
- **Enviar por WhatsApp / Compartir**: manda el enlace de la carta (al compartirlo se ve la imagen de la carta).
- **Imágenes descargables**: estados/historias (1080 × 1920) y publicación (1080 × 1350), en fondo Arena o Mar.

Las imágenes se generan en cada despliegue a partir de `src/data/menu.ts` (`src/lib/carta-imagen.ts` → `/descargas/*.png`), así que **no hay que regenerarlas a mano**: al cambiar un precio y hacer push, la carta y las imágenes se actualizan solas.

Se llega a la carta desde el menú por el enlace del encabezado, el primer chip de la barra de categorías, la sección "Toda la carta en una sola hoja" y el pie de página.

## Desarrollo

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # verifica tipos (astro check) y genera dist/
npm run preview   # sirve dist/ localmente
```

Requiere Node 20 o superior.

## Vercel

1. En Vercel: **Add New → Project** e importa `JosephAntonyDev/Mariscos_sonora_menu`.
2. Framework: **Astro** (lo detecta solo; `vercel.json` ya trae build, salida y caché).
3. Opcional: variable `SITE_URL` con el dominio definitivo (p. ej. `https://menu.mariscoselchiapas.com`) para que las vistas previas de WhatsApp usen ese dominio. Sin ella se usa el dominio de producción de Vercel.

## Marca

- `brand/source/` — imágenes originales (logo y flyers).
- `npm run brand` — regenera el kit desde el logo original: insignia PNG/WebP/SVG, logotipos vectoriales, firmas, íconos, favicon e imagen para compartir (`public/og-image.jpg`).
- `npm run photos` — recorta de los flyers las fotos de los platillos (`src/assets/fotos/`). Cuando haya fotos reales, reemplaza esos archivos con el mismo nombre.
- El kit descargable se publica en **`/marca`**.

**Nota sobre el SVG de la insignia:** la moneda con el camarón es una ilustración con degradados metálicos, así que `logo-insignia.svg` lleva dentro la imagen original en alta resolución. Es idéntico al original y funciona donde se pida SVG, pero no es un vector editable. Los **logotipos** (texto "Mariscos El Chiapas Sonora") sí son vectores puros. Para un vector 100 % editable de la ilustración hace falta redibujarla en Illustrator.
