import { DIAS, hora12, type Turno } from '../data/negocio';

const aMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Día y minuto actuales en la zona horaria del negocio (no en la del visitante). */
export function ahoraEn(zona: string, fecha = new Date()) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: zona,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(fecha);
  const get = (t: string) => partes.find((p) => p.type === t)?.value ?? '0';
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { dia, minuto: Number(get('hour')) * 60 + Number(get('minute')) };
}

export type Estado =
  | { abierto: true; texto: string }
  | { abierto: false; texto: string };

export function estadoActual(horario: readonly Turno[], zona: string, cierreAgotar: string, fecha = new Date()): Estado {
  const { dia, minuto } = ahoraEn(zona, fecha);
  const hoy = horario.find((t) => t.dia === dia);
  if (hoy) {
    const abre = aMinutos(hoy.abre);
    const cierra = aMinutos(hoy.cierra ?? cierreAgotar);
    if (minuto >= abre && minuto < cierra) {
      return {
        abierto: true,
        texto: hoy.cierra ? `Abierto · cierra a las ${hora12(hoy.cierra)}` : 'Abierto · hasta agotar producto',
      };
    }
    if (minuto < abre) return { abierto: false, texto: `Cerrado · abrimos hoy a las ${hora12(hoy.abre)}` };
  }
  // Buscar el siguiente día con servicio.
  for (let i = 1; i <= 7; i++) {
    const d = (dia + i) % 7;
    const t = horario.find((x) => x.dia === d);
    if (t) {
      const cuando = i === 1 ? 'mañana' : `el ${DIAS[d].toLowerCase()}`;
      return { abierto: false, texto: `Cerrado · abrimos ${cuando} a las ${hora12(t.abre)}` };
    }
  }
  return { abierto: false, texto: 'Cerrado' };
}

/** Agrupa días consecutivos con el mismo horario: "Jueves y viernes · 11 am – 7 pm". */
export function horarioAgrupado(horario: readonly Turno[]) {
  const grupos: { dias: number[]; abre: string; cierra: string | null }[] = [];
  for (const t of [...horario].sort((a, b) => a.dia - b.dia)) {
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.abre === t.abre && ultimo.cierra === t.cierra && ultimo.dias.at(-1) === t.dia - 1) {
      ultimo.dias.push(t.dia);
    } else grupos.push({ dias: [t.dia], abre: t.abre, cierra: t.cierra });
  }
  return grupos.map((g) => {
    const nombres = g.dias.map((d) => DIAS[d]);
    const dias =
      nombres.length === 1 ? nombres[0] : nombres.length === 2 ? `${nombres[0]} y ${nombres[1].toLowerCase()}` : `${nombres[0]} a ${nombres.at(-1)!.toLowerCase()}`;
    const horas = g.cierra ? `${hora12(g.abre)} – ${hora12(g.cierra)}` : `Desde las ${hora12(g.abre)}, hasta agotar producto`;
    return { dias, horas, diasNum: g.dias };
  });
}
