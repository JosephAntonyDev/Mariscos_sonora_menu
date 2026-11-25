import { useEffect, useState } from 'react';
import type { Turno } from '../data/negocio';
import { estadoActual, type Estado } from '../lib/horario';

interface Props {
  horario: readonly Turno[];
  zona: string;
  cierreAgotar: string;
  /** Texto que se ve antes de calcular el estado (y sin JavaScript). */
  resumen: string;
}

/** Píldora "Abierto / Cerrado" calculada con la hora de Tuxtla, no la del visitante. */
export default function EstadoHorario({ horario, zona, cierreAgotar, resumen }: Props) {
  const [estado, setEstado] = useState<Estado | null>(null);

  useEffect(() => {
    const calcular = () => setEstado(estadoActual(horario, zona, cierreAgotar));
    calcular();
    const id = window.setInterval(calcular, 60_000);
    return () => window.clearInterval(id);
  }, [horario, zona, cierreAgotar]);

  const clase = estado ? (estado.abierto ? 'estado estado--abierto' : 'estado estado--cerrado') : 'estado';
  return (
    <p className={clase} aria-live="polite">
      <span className="estado__punto" aria-hidden="true" />
      {estado ? estado.texto : resumen}
    </p>
  );
}
