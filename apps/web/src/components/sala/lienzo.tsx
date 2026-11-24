import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Obra completa (object-contain) sobre su propio fondo desenfocado (cover).
 * Nunca recorta la pintura. `obraId` marca la caja para comprobar que no se repite.
 */
export function Lienzo({
  src,
  obraId,
  alt = "",
  priority = false,
  className,
  imgClassName,
  children,
}: {
  src: string;
  obraId?: string;
  alt?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div data-obra={obraId} className={cn("sala-lienzo relative overflow-hidden bg-[#0C0B09]", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" aria-hidden="true" loading="lazy" decoding="async" className="bucle-fondo pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[#100E0C]/45" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        className={cn("sala-obra absolute inset-0 h-full w-full object-contain", imgClassName)}
      />
      {children}
    </div>
  );
}

/** Tarjeta de obra completa: relación de aspecto dada, título y una línea de meta. */
export function LienzoCard({
  src,
  obraId,
  titulo,
  meta,
  aspect = "4 / 5",
  accion,
  className,
}: {
  src: string;
  obraId?: string;
  titulo: string;
  meta?: string;
  aspect?: string;
  accion?: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("overflow-hidden rounded-3xl bg-[#1B1815]", className)}>
      <Lienzo src={src} obraId={obraId} className="radio-obra m-2" imgClassName="p-0">
        <div style={{ aspectRatio: aspect }} className="invisible" aria-hidden="true" />
        {accion}
      </Lienzo>
      <div className="px-4 pt-1 pb-4">
        <h3 className="font-display text-xl leading-tight">{titulo}</h3>
        {meta ? <p className="t-meta mt-1 tabular-nums">{meta}</p> : null}
      </div>
    </article>
  );
}
