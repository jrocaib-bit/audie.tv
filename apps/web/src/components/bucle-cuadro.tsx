"use client";

import { useEffect, useRef, useState } from "react";
import { CONSULTA_MOVIL, fuentesParaAncho, type Bucle, type FuenteVideo } from "@/lib/bucles";

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
  const [fuentes, setFuentes] = useState<FuenteVideo[]>([]);

  const mp4 = bucle.mp4;
  const webm = bucle.webm;
  const mp4Movil = bucle.mp4Movil;
  const webmMovil = bucle.webmMovil;

  useEffect(() => {
    if (quiereQuieto()) return;
    const nodo = caja.current;
    let observador: IntersectionObserver | undefined;
    let idle = 0;
    let espera: ReturnType<typeof setTimeout> | null = null;
    const elegir = () => {
      const estrecho = window.matchMedia?.(CONSULTA_MOVIL).matches === true;
      setFuentes(fuentesParaAncho({ mp4, webm, poster: "", mp4Movil, webmMovil, posterMovil: "", alt: "", aspect: "" }, estrecho));
      setMontar(true);
    };
    const armar = () => {
      if (!nodo || typeof IntersectionObserver === "undefined") {
        elegir();
        return;
      }
      observador = new IntersectionObserver(([entrada]) => {
        if (entrada?.isIntersecting) elegir();
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
  }, [mp4, webm, mp4Movil, webmMovil]);

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
  const cajaClase = ["bucle-cuadro", "absolute", "inset-0", "overflow-hidden", ...className.split(/\s+/).filter((token) => token && token !== "h-full" && token !== "w-full")].join(" ");

  return (
    <div ref={caja} className={cajaClase} style={{ backgroundColor: "#100E0C" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt="" aria-hidden="true" className="bucle-fondo pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[#100E0C]/55" aria-hidden="true" />
      <picture className="absolute inset-0 block">
        {bucle.posterMovil ? <source media="(max-width: 1280px)" srcSet={bucle.posterMovil} /> : null}
        <img src={poster} alt={bucle.alt} fetchPriority={priority ? "high" : "auto"} decoding={priority ? "sync" : "async"} className="bucle-poster absolute inset-0 h-full w-full object-contain" />
      </picture>
      {montar && fuentes.length > 0 ? (
        <video
          ref={video}
          className={`bucle-video absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
          muted
          autoPlay
          loop
          playsInline
          preload="none"
          controls={false}
          aria-hidden="true"
          onCanPlayThrough={() => setVisible(true)}
          onError={(evento) => {
            if (evento.target !== evento.currentTarget) return;
            setVisible(false);
            setMontar(false);
          }}
        >
          {fuentes.map((fuente) => <source key={fuente.src} src={fuente.src} type={fuente.type} />)}
        </video>
      ) : null}
    </div>
  );
}
