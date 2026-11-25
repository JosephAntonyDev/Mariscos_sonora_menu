import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ProductoPedido } from '../data/menu';
import { ICONOS, type NombreIcono } from '../lib/iconos';

interface Props {
  catalogo: ProductoPedido[];
  whatsapp: string;
  notaEnvio: string;
  notaPago: string;
}

type Carrito = Record<string, number>;
type Entrega = 'domicilio' | 'recoger';

const LLAVE = 'mecs-pedido-v1';
const fmt = (n: number) => `$${n.toLocaleString('es-MX')}`;

function Ico({ n, tam = 20 }: { n: NombreIcono; tam?: number }) {
  const solido = n === 'whatsapp';
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true" fill={solido ? 'currentColor' : 'none'}
      stroke={solido ? 'none' : 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONOS[n]} />
    </svg>
  );
}

const leer = (): Carrito => {
  try {
    const v = JSON.parse(localStorage.getItem(LLAVE) ?? '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
};

/**
 * Carrito de pedido. Los botones "+" del menú son HTML estático con
 * data-agregar="clave"; este componente los escucha y arma el mensaje de WhatsApp.
 * Solo se guarda el carrito en el navegador; nombre y dirección nunca se guardan.
 */
export default function Pedido({ catalogo, whatsapp, notaEnvio, notaPago }: Props) {
  const porClave = useMemo(() => new Map(catalogo.map((p) => [p.clave, p])), [catalogo]);
  const [carrito, setCarrito] = useState<Carrito>({});
  const [aviso, setAviso] = useState('');
  const [entrega, setEntrega] = useState<Entrega>('domicilio');
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');
  const dialogo = useRef<HTMLDialogElement>(null);
  const cargado = useRef(false);

  // Restaurar carrito (descartando productos que ya no existen en la carta).
  useEffect(() => {
    const guardado = leer();
    setCarrito(Object.fromEntries(Object.entries(guardado).filter(([k, v]) => porClave.has(k) && Number(v) > 0)));
    cargado.current = true;
    document.documentElement.setAttribute('data-pedido-listo', '');
  }, [porClave]);

  useEffect(() => {
    if (!cargado.current) return;
    try {
      localStorage.setItem(LLAVE, JSON.stringify(carrito));
    } catch {
      /* modo privado o almacenamiento bloqueado: el carrito funciona igual */
    }
    document.documentElement.toggleAttribute('data-con-pedido', Object.keys(carrito).length > 0);
    // Contador sobre cada botón "+".
    document.querySelectorAll<HTMLElement>('[data-agregar]').forEach((b) => {
      const n = carrito[b.dataset.agregar!];
      if (n) b.dataset.cantidad = String(n);
      else delete b.dataset.cantidad;
    });
  }, [carrito]);

  const cambiar = useCallback((clave: string, delta: number) => {
    setCarrito((c) => {
      const n = Math.max(0, Math.min(99, (c[clave] ?? 0) + delta));
      const sig = { ...c };
      if (n) sig[clave] = n;
      else delete sig[clave];
      return sig;
    });
  }, []);

  // Delegación: un solo listener para todos los botones "+" del menú.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as Element).closest<HTMLElement>('[data-agregar]');
      if (!btn) return;
      const p = porClave.get(btn.dataset.agregar!);
      if (!p) return;
      cambiar(p.clave, 1);
      setAviso(`Agregado: ${p.nombre}${p.presentacion ? ` (${p.presentacion})` : ''}`);
      btn.classList.remove('pulso');
      void btn.offsetWidth;
      btn.classList.add('pulso');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [porClave, cambiar]);

  const lineas = Object.entries(carrito)
    .map(([clave, cantidad]) => ({ p: porClave.get(clave)!, cantidad }))
    .filter((l) => l.p);
  const piezas = lineas.reduce((n, l) => n + l.cantidad, 0);
  const total = lineas.reduce((n, l) => n + l.cantidad * l.p.monto, 0);

  const mensaje = () => {
    const filas = lineas.map(
      (l) => `• ${l.cantidad} × ${l.p.nombre}${l.p.presentacion ? ` (${l.p.presentacion})` : ''} — ${fmt(l.cantidad * l.p.monto)}`,
    );
    const texto = ['¡Hola! Quiero hacer un pedido 🦐', '', ...filas, ''];
    texto.push(`*Total: ${fmt(total)}*${entrega === 'domicilio' ? ' + envío' : ''}`);
    texto.push(`Entrega: ${entrega === 'domicilio' ? 'A domicilio' : 'Paso a recoger'}`);
    if (nombre.trim()) texto.push(`Nombre: ${nombre.trim()}`);
    if (entrega === 'domicilio' && direccion.trim()) texto.push(`Dirección: ${direccion.trim()}`);
    if (notas.trim()) texto.push(`Notas: ${notas.trim()}`);
    return texto.join('\n');
  };

  const abrir = () => dialogo.current?.showModal();
  const cerrar = () => dialogo.current?.close();

  if (piezas === 0) {
    return <p className="sr-only" aria-live="polite">{aviso}</p>;
  }

  return (
    <>
      <p className="sr-only" aria-live="polite">{aviso}</p>

      <div className="barra-pedido" role="region" aria-label="Tu pedido">
        <button type="button" className="barra-pedido__btn" onClick={abrir}>
          <span className="barra-pedido__icono"><Ico n="bolsa" /><b>{piezas}</b></span>
          <span className="barra-pedido__txt">Ver mi pedido</span>
          <span className="barra-pedido__total">{fmt(total)}</span>
        </button>
      </div>

      <dialog ref={dialogo} className="hoja" aria-labelledby="hoja-titulo"
        onClick={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
        <form method="dialog" className="hoja__in" onSubmit={(e) => e.preventDefault()}>
          <header className="hoja__cabeza">
            <h2 id="hoja-titulo">Tu pedido</h2>
            <button type="button" className="hoja__cerrar" onClick={cerrar} aria-label="Cerrar"><Ico n="cerrar" /></button>
          </header>

          <ul className="hoja__lista">
            {lineas.map(({ p, cantidad }) => (
              <li key={p.clave} className="linea">
                <div className="linea__info">
                  <span className="linea__nombre">{p.nombre}</span>
                  {p.presentacion && <span className="linea__pres">{p.presentacion}</span>}
                  <span className="linea__unit">{fmt(p.monto)} c/u</span>
                </div>
                <div className="contador" role="group" aria-label={`Cantidad de ${p.nombre}`}>
                  <button type="button" onClick={() => cambiar(p.clave, -1)} aria-label={`Quitar uno de ${p.nombre}`}><Ico n="menos" tam={18} /></button>
                  <output aria-live="polite">{cantidad}</output>
                  <button type="button" onClick={() => cambiar(p.clave, 1)} aria-label={`Agregar uno de ${p.nombre}`}><Ico n="mas" tam={18} /></button>
                </div>
                <span className="linea__sub">{fmt(p.monto * cantidad)}</span>
              </li>
            ))}
          </ul>

          <fieldset className="hoja__entrega">
            <legend>¿Cómo lo quieres?</legend>
            <label className={entrega === 'domicilio' ? 'activa' : ''}>
              <input type="radio" name="entrega" checked={entrega === 'domicilio'} onChange={() => setEntrega('domicilio')} />
              <Ico n="moto" /> A domicilio
            </label>
            <label className={entrega === 'recoger' ? 'activa' : ''}>
              <input type="radio" name="entrega" checked={entrega === 'recoger'} onChange={() => setEntrega('recoger')} />
              <Ico n="bolsa" /> Paso a recoger
            </label>
          </fieldset>

          <div className="hoja__campos">
            <label>
              <span>Tu nombre</span>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" maxLength={60} placeholder="Opcional" />
            </label>
            {entrega === 'domicilio' && (
              <label>
                <span>Dirección y referencias</span>
                <textarea value={direccion} onChange={(e) => setDireccion(e.target.value)} autoComplete="street-address" rows={2} maxLength={240}
                  placeholder="Calle, número, colonia y alguna referencia" />
              </label>
            )}
            <label>
              <span>Notas</span>
              <input value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={140} placeholder="Ej. sin cebolla, bien picoso…" />
            </label>
          </div>

          <div className="hoja__total">
            <span>Total</span>
            <strong>{fmt(total)}</strong>
          </div>
          <p className="hoja__nota">{entrega === 'domicilio' ? notaEnvio : 'Te avisamos por WhatsApp cuando esté listo.'} {notaPago}</p>

          <div className="hoja__acciones">
            <a className="boton boton--primario" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje())}`} target="_blank" rel="noopener">
              <Ico n="whatsapp" /> Enviar pedido por WhatsApp
            </a>
            <button type="button" className="hoja__vaciar" onClick={() => { setCarrito({}); cerrar(); }}>Vaciar pedido</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
