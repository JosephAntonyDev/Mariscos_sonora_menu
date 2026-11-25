import type { Font } from 'opentype.js';

export const ROOT: string;
export function r(...segmentos: string[]): string;
export const COLOR: Record<
  'cafe' | 'cobre' | 'oro' | 'oroClaro' | 'camaron' | 'mar' | 'marClaro' | 'arena' | 'blanco' | 'negro',
  string
>;
export const FONT: Record<'extrabold' | 'bold' | 'semibold' | 'texto' | 'textoBold', Font>;
export interface TextoTrazado { d: string; width: number; ascent: number; size: number }
export function textPath(
  font: Font,
  text: string,
  opts?: { x?: number; y?: number; size?: number; tracking?: number; align?: 'left' | 'center' | 'right'; max?: number },
): TextoTrazado;
