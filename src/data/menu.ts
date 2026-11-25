/**
 * ═══════════════════════════════════════════════════════════════
 *  CARTA — edita aquí platillos, descripciones y precios.
 *
 *  • Cambiar un precio: modifica el número en `precios`.
 *  • Ocultar un platillo sin borrarlo: pon `disponible: false`.
 *  • Agregar un platillo: copia un bloque { … } dentro de su categoría
 *    y dale un `id` único (minúsculas y guiones).
 *  • Etiquetas disponibles: 'nuevo' | 'tiempo-limitado' | 'paquete' | 'favorito'.
 *  • Foto: importa la imagen arriba (src/assets/fotos) y asígnala en `foto`.
 *
 *  Precios en pesos mexicanos (MXN), sin el signo $.
 * ═══════════════════════════════════════════════════════════════
 */
import type { ImageMetadata } from 'astro';
import naranjera from '../assets/fotos/naranjera.png';
import arreglada from '../assets/fotos/arreglada.png';
import ceviche from '../assets/fotos/ceviche.png';
import aguachile from '../assets/fotos/aguachile.png';
import tosticeviche from '../assets/fotos/tosticeviche.png';
import especial from '../assets/fotos/especial.png';
// Fotos de referencia (Unsplash). Créditos en src/assets/fotos/CREDITOS.md
import cocaCola from '../assets/fotos/coca-cola.jpg';
import boing from '../assets/fotos/boing.jpg';
import agua from '../assets/fotos/agua.jpg';

export type Etiqueta = 'nuevo' | 'tiempo-limitado' | 'paquete' | 'favorito';

export interface Precio {
  /** Nombre de la presentación ("Litro", "½ litro"). Omitir si hay un solo precio. */
  presentacion?: string;
  monto: number;
}

export interface Platillo {
  id: string;
  nombre: string;
  descripcion?: string;
  /** Lista corta que se muestra como ingredientes. */
  ingredientes?: string[];
  precios: Precio[];
  etiquetas?: Etiqueta[];
  foto?: ImageMetadata;
  /** Texto alternativo de la foto (accesibilidad). */
  fotoAlt?: string;
  disponible?: boolean;
  /** Aparece en el carrusel de "Lo más antojable". */
  destacado?: boolean;
}

export interface Categoria {
  id: string;
  nombre: string;
  /** Nombre corto para la barra de categorías. */
  corto: string;
  descripcion?: string;
  platillos: Platillo[];
}

export const ETIQUETAS: Record<Etiqueta, string> = {
  nuevo: 'Nuevo',
  'tiempo-limitado': 'Por tiempo limitado',
  paquete: 'Paquete',
  favorito: 'Favorito',
};

export const carta: Categoria[] = [
  {
    id: 'ceviches-aguachiles',
    nombre: 'Ceviches y aguachiles',
    corto: 'Ceviches',
    descripcion: 'Preparados al momento, frescos y bien fríos.',
    platillos: [
      {
        id: 'ceviche-mango',
        nombre: 'Ceviche con mango',
        descripcion: 'Nuestro ceviche con el toque dulce del mango.',
        precios: [
          { presentacion: 'Litro', monto: 280 },
          { presentacion: '½ litro', monto: 150 },
        ],
        etiquetas: ['favorito'],
        foto: ceviche,
        fotoAlt: 'Tazones de ceviche de camarón con mango, pepino y limón',
        destacado: true,
      },
      {
        id: 'aguachile',
        nombre: 'Aguachile',
        descripcion: 'Picosito, como debe ser.',
        precios: [{ presentacion: 'La orden', monto: 270 }],
        foto: aguachile,
        fotoAlt: 'Plato de aguachile con rosa de aguacate, pepino y totopos',
      },
    ],
  },
  {
    id: 'tostadas',
    nombre: 'Tostadas y botanas',
    corto: 'Tostadas',
    platillos: [
      {
        id: 'la-arreglada',
        nombre: 'Tostada La Arreglada',
        descripcion: 'Un festín de sabores del mar, “arreglado” a la perfección.',
        ingredientes: ['Camarón cocido', 'Camarón curtido', 'Ceviche de camarón', 'Salsa especial de la casa'],
        precios: [{ monto: 85 }],
        etiquetas: ['tiempo-limitado'],
        foto: arreglada,
        fotoAlt: 'Tostada con camarones, ceviche y aguacate, decorada con salsa y rodajas de naranja',
        destacado: true,
      },
      {
        id: 'tosticeviche',
        nombre: 'Tosticeviche',
        descripcion: 'Ceviche para botanear.',
        precios: [{ monto: 90 }],
        foto: tosticeviche,
        fotoAlt: 'Ceviche de camarón con mango servido en una bolsa de totopos',
      },
    ],
  },
  {
    id: 'especiales',
    nombre: 'Paquetes especiales',
    corto: 'Paquetes',
    platillos: [
      {
        id: 'la-especial-new',
        nombre: 'La Especial New',
        descripcion: 'Paquete especial de la casa. Incluye 1 Coca-Cola de 500 ml.',
        precios: [{ monto: 500 }],
        etiquetas: ['paquete'],
        foto: especial,
        fotoAlt: 'Aguachile con totopos y tostada de mariscos, referencia del paquete',
        destacado: true,
      },
    ],
  },
  {
    id: 'preparados',
    nombre: 'Bebidas preparadas',
    corto: 'Preparados',
    platillos: [
      {
        id: 'la-naranjera',
        nombre: 'La Naranjera',
        descripcion: 'Clamato preparado con camarón fresco, escarchado con chile y tamarindo.',
        ingredientes: ['Clamato', 'Camarón fresco', 'Salsas negras', 'Apio crujiente', 'Dulce de tamarindo', 'Jugo de limón'],
        precios: [{ monto: 150 }],
        etiquetas: ['nuevo'],
        foto: naranjera,
        fotoAlt: 'Vaso de Clamato preparado con camarones, apio y popote amarillo, en la playa',
        destacado: true,
      },
    ],
  },
  {
    id: 'bebidas',
    nombre: 'Refrescos y agua',
    corto: 'Bebidas',
    platillos: [
      {
        id: 'coca-500',
        nombre: 'Coca-Cola',
        descripcion: '500 ml',
        precios: [{ monto: 35 }],
        foto: cocaCola,
        fotoAlt: 'Botella de Coca-Cola fría (foto de referencia)',
      },
      {
        id: 'boing',
        nombre: 'Boing',
        descripcion: '340 ml · Mango, fresa, manzana o guayaba',
        precios: [{ monto: 25 }],
        foto: boing,
        fotoAlt: 'Cajitas de Boing de mango y uva',
      },
      {
        id: 'agua-1l',
        nombre: 'Agua natural',
        descripcion: '1 litro',
        precios: [{ monto: 15 }],
        foto: agua,
        fotoAlt: 'Botella de agua natural (foto de referencia)',
      },
    ],
  },
];

/** Platillos visibles (respeta `disponible: false`). */
export const categoriasVisibles = carta
  .map((c) => ({ ...c, platillos: c.platillos.filter((p) => p.disponible !== false) }))
  .filter((c) => c.platillos.length > 0);

export const destacados = categoriasVisibles.flatMap((c) => c.platillos).filter((p) => p.destacado);

/** Formato de precio: 1500 → "$1,500" */
export const precio = (monto: number) => `$${monto.toLocaleString('es-MX')}`;

/** Catálogo plano para el carrito: clave = "platillo" o "platillo:presentacion". */
export interface ProductoPedido { clave: string; nombre: string; presentacion?: string; monto: number }
export const catalogoPedido: ProductoPedido[] = categoriasVisibles.flatMap((c) =>
  c.platillos.flatMap((p) =>
    p.precios.map((pr, i) => ({
      clave: p.precios.length > 1 ? `${p.id}:${i}` : p.id,
      nombre: p.nombre,
      presentacion: p.precios.length > 1 ? pr.presentacion : undefined,
      monto: pr.monto,
    })),
  ),
);
