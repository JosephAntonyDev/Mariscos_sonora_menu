import { useEffect, useState } from 'react';
import type { Turno } from '../data/negocio';
import { estadoActual, type Estado } from '../lib/horario';
import { ICONOS } from '../lib/iconos';

interface Props {
  horario: readonly Turno[];
  zona: string;
  cierreAgotar: string;
  /** Texto que se ve antes de calcular el estado (y sin JavaScript). */
  resumen: string;
}

/** Línea "Abierto / Cerrado" calculada con la hora de Tuxtla, no la del visitante. */
export default function EstadoHorario({ horario, zona, cierreAgotar, resumen }: Props) {
  const [estado, setEstado] = useState<Estado | null>(null);

  useEffect(() => {
    const calcular = () => setEstado(estadoActual(horario, zona, cierreAgotar));
    calcular();
    const id = window.setInterval(calcular, 60_000);
    return () => window.clearInterval(id);
  }, [horario, zona, cierreAgotar]);

  // "Cerrado · abrimos el jueves…" → etiqueta en negritas + detalle
  const [etiqueta, ...resto] = (estado?.texto ?? '').split(' · ');
  const clase = estado ? (estado.abierto ? 'estado estado--abierto' : 'estado estado--cerrado') : 'estado';

  return (
    <p className={clase} aria-live="polite">
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d={ICONOS.reloj} />
      </svg>
      {estado ? (
        <span>
          <strong>{etiqueta}</strong>
          {resto.length > 0 && <> — {resto.join(' · ')}</>}
        </span>
      ) : (
        <span>{resumen}</span>
      )}
    </p>
  );
}
