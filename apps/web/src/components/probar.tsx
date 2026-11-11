"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type FichaPrueba = { id: string; titulo: string };

type Estado = {
  id: string | null;
  sonando: boolean;
  reproducir: (ficha: FichaPrueba) => void;
};

const Probar = createContext<Estado | null>(null);

export function ProbarAudio({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [actual, setActual] = useState<FichaPrueba | null>(null);
  const [fraccion, setFraccion] = useState(0);
  const [sonando, setSonando] = useState(false);

  async function reproducir(ficha: FichaPrueba) {
    const elemento = audio.current;
    if (!elemento) return;
    if (actual?.id === ficha.id && elemento.src) {
      if (elemento.paused) await elemento.play().catch(() => undefined);
      else elemento.pause();
      return;
    }
    setActual(ficha);
    setFraccion(0);
    const respuesta = await fetch(`/api/audio/${ficha.id}`, { cache: "no-store" });
    if (!respuesta.ok) return;
    const dato = await respuesta.json() as { url?: string };
    if (!dato.url) return;
    elemento.src = dato.url;
    await elemento.play().catch(() => undefined);
  }

  return (
    <Probar.Provider value={{ id: actual?.id ?? null, sonando, reproducir }}>
      {children}
      <audio
        ref={audio}
        className="sr-only"
        controlsList="nodownload"
        onTimeUpdate={(evento) => {
          const elemento = evento.currentTarget;
          setFraccion(elemento.duration ? elemento.currentTime / elemento.duration : 0);
        }}
        onPlay={() => setSonando(true)}
        onPause={() => setSonando(false)}
      />
      {actual ? (
        <div className="barra-fija" role="region" aria-label={actual.titulo}>
          <button type="button" className="boton inline-flex size-11 items-center justify-center rounded-full bg-[#C9A96E] text-[#100E0C]" onClick={() => void reproducir(actual)} aria-label={actual.titulo}>
            {sonando ? <Onda /> : <Play />}
          </button>
          <span className="min-w-0 flex-1 truncate">{actual.titulo}</span>
          <span className="pista" aria-hidden="true"><span className="progreso" style={{ width: `${Math.round(fraccion * 100)}%` }} /></span>
        </div>
      ) : null}
    </Probar.Provider>
  );
}

export function BotonProbar({ ficha, etiqueta, className, icono = false }: { ficha: FichaPrueba; etiqueta: string; className?: string; icono?: boolean }) {
  const estado = useContext(Probar);
  const activo = estado?.id === ficha.id && estado.sonando;
  return (
    <button type="button" className={className} aria-label={etiqueta} aria-pressed={activo} onClick={() => estado?.reproducir(ficha)}>
      {icono ? (activo ? <Onda /> : <Play />) : etiqueta}
    </button>
  );
}

export function Contador({ valor, prefijo = "" }: { valor: number; prefijo?: string }) {
  const [n, setN] = useState(valor);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nodo = ref.current;
    if (!nodo) return;
    let hecho = false;
    const observer = new IntersectionObserver(([entrada]) => {
      if (!entrada?.isIntersecting || hecho) return;
      hecho = true;
      const inicio = performance.now();
      const paso = (ahora: number) => {
        const avance = Math.min(1, (ahora - inicio) / 900);
        setN(Math.round(valor * (1 - (1 - avance) ** 3)));
        if (avance < 1) requestAnimationFrame(paso);
      };
      setN(0);
      requestAnimationFrame(paso);
    }, { threshold: 0.5 });
    observer.observe(nodo);
    return () => observer.disconnect();
  }, [valor]);
  return <span ref={ref} className="tabular-nums">{prefijo}{n}</span>;
}

export function Telefono({ saludo, dia, racha, caminos, obra }: { saludo: string; dia: string; racha: string; caminos: string; obra: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const mover = () => {
      const nodo = ref.current;
      if (!nodo) return;
      const caja = nodo.getBoundingClientRect();
      const progreso = Math.min(1, Math.max(0, (window.innerHeight * 0.55 - caja.top) / Math.max(caja.height * 1.4, 1)));
      setIndice(Math.min(2, Math.floor(progreso * 3)));
    };
    mover();
    window.addEventListener("scroll", mover, { passive: true });
    return () => window.removeEventListener("scroll", mover);
  }, []);
  return (
    <div ref={ref} className="telefono mx-auto">
      <div className="marco-telefono">
        <span className="notch" aria-hidden="true" />
        <div className="pantalla relative aspect-[9/19] overflow-hidden bg-[#100E0C] text-[#F4ECE2]">
          <div className="capa-pantalla" style={{ opacity: indice === 0 ? 1 : 0 }} aria-hidden={indice !== 0}>
            <p className="px-4 pt-10 font-display text-2xl">{saludo}</p>
            <div className="mx-3 mt-4 overflow-hidden rounded-2xl bg-[#1B1815]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={obra} alt="" loading="lazy" decoding="async" className="h-28 w-full object-cover" />
              <p className="px-3 py-3 text-sm">{dia}</p>
            </div>
          </div>
          <div className="capa-pantalla flex flex-col items-center px-4 pt-12" style={{ opacity: indice === 1 ? 1 : 0 }} aria-hidden={indice !== 1}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={obra} alt="" loading="lazy" decoding="async" className="size-28 rounded-2xl object-cover" />
            <p className="mt-4 text-center font-display text-xl">{dia}</p>
            <span className="pista mt-6 block h-1 w-4/5 overflow-hidden rounded-full bg-[#2E2924]"><span className="progreso" style={{ width: "42%" }} /></span>
            <span className="mt-5 inline-flex size-12 items-center justify-center rounded-full bg-[#C9A96E] text-[#100E0C]"><Play /></span>
          </div>
          <div className="capa-pantalla px-4 pt-12" style={{ opacity: indice === 2 ? 1 : 0 }} aria-hidden={indice !== 2}>
            <p className="font-display text-2xl">{racha}</p>
            <p className="font-display text-6xl text-[#C9A96E]">7</p>
            <span className="mt-4 flex gap-1.5" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} className={`size-2 rounded-full ${i < 5 ? "bg-[#C9A96E]" : "bg-[#2E2924]"}`} />)}</span>
            <p className="mt-4 text-sm text-[#B7AB9C]">{caminos}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Acordeon({ items }: { items: readonly (readonly [string, string])[] }) {
  const [abierto, setAbierto] = useState<number | null>(0);
  return (
    <div>
      {items.map(([pregunta, respuesta], indice) => {
        const activo = abierto === indice;
        return (
          <div key={pregunta} className="border-b border-[#2E2924]">
            <button type="button" className="flex min-h-14 w-full items-center justify-between gap-4 text-left" aria-expanded={activo} onClick={() => setAbierto(activo ? null : indice)}>
              <span className="font-display text-2xl">{pregunta}</span>
              <svg viewBox="0 0 24 24" className={`chevron size-5 shrink-0 text-[#C9A96E] ${activo ? "rotate-180" : ""}`} aria-hidden="true">
                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            {activo ? <p className="pb-4 text-[#E7D7C3]">{respuesta}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

function Play() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor" />
    </svg>
  );
}

function Onda() {
  return <span className="onda" aria-hidden="true"><i /><i /><i /><i /></span>;
}
