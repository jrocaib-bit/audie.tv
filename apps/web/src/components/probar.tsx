"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";

export type FichaPrueba = { id: string; titulo: string };

const Probar = createContext<((ficha: FichaPrueba) => void) | null>(null);

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
    <Probar.Provider value={reproducir}>
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
          <button type="button" className="boton inline-flex size-11 items-center justify-center rounded-full bg-[#C9A96E] text-[#100E0C]" onClick={() => void reproducir(actual)} aria-label={actual.titulo}>{sonando ? "❚❚" : "▶"}</button>
          <span className="min-w-0 flex-1 truncate">{actual.titulo}</span>
          <span className="pista" aria-hidden="true"><span className="progreso" style={{ width: `${Math.round(fraccion * 100)}%` }} /></span>
        </div>
      ) : null}
    </Probar.Provider>
  );
}

export function BotonProbar({ ficha, etiqueta, className }: { ficha: FichaPrueba; etiqueta: string; className?: string }) {
  const reproducir = useContext(Probar);
  return <button type="button" className={className} onClick={() => reproducir?.(ficha)}>{etiqueta}</button>;
}
