/**
 * ═══════════════════════════════════════════════════════════════
 *  DATOS DEL NEGOCIO — edita aquí teléfono, horario y dirección.
 *  Después de guardar, haz commit y push: Vercel publica solo.
 * ═══════════════════════════════════════════════════════════════
 */

export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = domingo … 6 = sábado

export interface Turno {
  dia: DiaSemana;
  abre: string; // "HH:MM" en 24 h, hora de Tuxtla
  /** Hora de cierre. null = "hasta agotar producto". */
  cierra: string | null;
}

export const negocio = {
  nombre: 'Mariscos El Chiapas Sonora',
  nombreCorto: 'El Chiapas Sonora',
  lema: 'Ceviches, aguachiles y tostadas con sabor a Sonora, aquí en Tuxtla.',
  ciudad: 'Tuxtla Gutiérrez, Chiapas',

  telefono: {
    visible: '961 282 0116',
    tel: '+529612820116', // para el enlace "Llamar"
    whatsapp: '529612820116', // formato wa.me: país + número, sin "+" ni espacios
  },

  direccion: {
    linea: 'Entrada a la Col. 13 de Julio',
    ciudad: 'Tuxtla Gutiérrez, Chiapas',
    // Sustituye por el enlace exacto de Google Maps del local si lo tienes.
    mapa: 'https://www.google.com/maps/search/?api=1&query=Entrada+a+la+Colonia+13+de+Julio%2C+Tuxtla+Guti%C3%A9rrez%2C+Chiapas',
  },

  redes: {
    usuario: '@MariscosElChiapasSonora',
    facebook: 'https://www.facebook.com/MariscosElChiapasSonora',
    instagram: 'https://www.instagram.com/MariscosElChiapasSonora',
  },

  zonaHoraria: 'America/Mexico_City',
  horario: [
    { dia: 4, abre: '11:00', cierra: '19:00' },
    { dia: 5, abre: '11:00', cierra: '19:00' },
    { dia: 6, abre: '11:00', cierra: null },
  ] satisfies Turno[],
  /** Solo para el aviso "Abierto/Cerrado" cuando el cierre es "hasta agotar". */
  cierreEstimadoAgotar: '19:00',

  domicilio: {
    disponible: true,
    nota: 'Servicio a domicilio con costo extra según tu ubicación.',
  },

  pago: {
    transferencia: true,
    /**
     * Datos bancarios para transferencias. Se dejan vacíos a propósito:
     * si quieren mostrarlos en el menú, escríbanlos aquí (banco, titular y
     * número de tarjeta/CLABE) y aparecerán en la sección "Pago".
     */
    datosTransferencia: null as null | { banco: string; titular: string; numero: string },
    notaComprobante: 'Envía tu comprobante de pago por WhatsApp al 961 282 0116.',
  },
} as const;

export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;

/** "19:00" → "7 pm", "11:30" → "11:30 am" */
export function hora12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const sufijo = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, '0')} ${sufijo}` : `${h12} ${sufijo}`;
}

export const waLink = (mensaje?: string) =>
  `https://wa.me/${negocio.telefono.whatsapp}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`;
