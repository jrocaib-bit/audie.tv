"use client";

import { useEffect, useRef, useState } from "react";
import type { Bucle } from "@/lib/bucles";

type Red = { saveData?: boolean };

function quiereQuieto(): boolean {
  if (typeof window === "undefined") return true;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  const datos = (navigator as Navigator & { connection?: Red }).connection?.saveData === true;
  return reduce || datos;
}

export function BucleCuadro({ bucle, className = "", priority = false }: { bucle: Bucle; className?: string; priority?: boolean }) {
  const caja = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [montar, setMontar] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (quiereQuieto()) return;
    const nodo = caja.current;
    let observador: IntersectionObserver | undefined;
    let idle = 0;
    let espera: ReturnType<typeof setTimeout> | null = null;
    const armar = () => {
      if (!nodo || typeof IntersectionObserver === "undefined") {
        setMontar(true);
        return;
      }
      observador = new IntersectionObserver(([entrada]) => {
        if (entrada?.isIntersecting) setMontar(true);
      });
      observador.observe(nodo);
    };
    const conHueco = typeof window.requestIdleCallback === "function";
    if (conHueco) idle = window.requestIdleCallback(armar, { timeout: 1200 });
    else espera = globalThis.setTimeout(armar, 1);
    return () => {
      if (conHueco) window.cancelIdleCallback(idle);
      else if (espera) globalThis.clearTimeout(espera);
      observador?.disconnect();
    };
  }, []);

  useEffect(() => {
    const elemento = video.current;
    if (!elemento || !montar) return;
    const seguir = () => {
      try {
        const hecho = elemento.play();
        if (hecho && typeof hecho.catch === "function") void hecho.catch(() => setVisible(false));
      } catch {
        setVisible(false);
      }
    };
    const vista = new IntersectionObserver(([entrada]) => {
      if (!entrada?.isIntersecting || document.hidden) elemento.pause();
      else seguir();
    });
    vista.observe(elemento);
    const alOcultar = () => {
      if (document.hidden) elemento.pause();
      else seguir();
    };
    document.addEventListener("visibilitychange", alOcultar);
    return () => {
      vista.disconnect();
      document.removeEventListener("visibilitychange", alOcultar);
    };
  }, [montar]);

  const poster = bucle.poster || bucle.posterMovil;

  return (
    <div ref={caja} className={`relative h-full w-full overflow-hidden ${className}`}>
      <picture className="absolute inset-0 block h-full w-full">
        {bucle.posterMovil ? <source media="(max-width: 1280px)" srcSet={bucle.posterMovil} /> : null}
        <img src={poster} alt={bucle.alt} fetchPriority={priority ? "high" : "auto"} decoding={priority ? "sync" : "async"} className="bucle-poster h-full w-full object-cover" />
      </picture>
      {montar ? (
        <video
          ref={video}
          className={`bucle-video absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
          muted
          autoPlay
          loop
          playsInline
          preload="none"
          controls={false}
          aria-hidden="true"
          onCanPlayThrough={() => setVisible(true)}
          onError={() => { setVisible(false); setMontar(false); }}
        >
          {bucle.webmMovil ? <source src={bucle.webmMovil} type="video/webm" media="(max-width: 1280px)" /> : null}
          {bucle.mp4Movil ? <source src={bucle.mp4Movil} type="video/mp4" media="(max-width: 1280px)" /> : null}
          {bucle.webm ? <source src={bucle.webm} type="video/webm" /> : null}
          {bucle.mp4 ? <source src={bucle.mp4} type="video/mp4" /> : null}
        </video>
      ) : null}
    </div>
  );
}
