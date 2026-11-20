import Link from "next/link";
import { Mark } from "@/components/brand";
import { cn } from "@/lib/utils";
import { Lienzo } from "./lienzo";

export const MAX_PUNTOS = 40;

export function PuntosDia({ total, hechos = 0, className }: { total: number; hechos?: number; className?: string }) {
  const visibles = Math.min(total, MAX_PUNTOS);
  const resto = total - visibles;
  return (
    <div className={cn("sala-puntos items-center", className)} data-puntos={visibles} aria-hidden="true">
      {Array.from({ length: visibles }, (_, indice) => <i key={indice} className="sala-punto" data-hecho={indice < hechos} />)}
      {resto > 0 ? <span className="t-meta ml-1">+{resto}</span> : null}
    </div>
  );
}

/**
 * Cartel de temporada. Con portada oficial (4:5 / 9:16) la portada llena el cartel;
 * con una pintura, se enmarca completa sobre su propio fondo desenfocado.
 */
export function RetoCartel({
  href,
  titulo,
  chip,
  meta,
  src,
  obraId,
  portadaOficial = false,
  ancho,
  dias,
  hechos = 0,
  heroe = false,
  priority = false,
  className,
}: {
  href: string;
  titulo: string;
  chip: string;
  meta?: string;
  src: string | null;
  obraId?: string;
  portadaOficial?: boolean;
  ancho?: string;
  dias: number;
  hechos?: number;
  heroe?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const aspecto = heroe ? "aspect-[4/5] md:aspect-[16/10]" : "aspect-[4/5]";
  return (
    <article data-cartel="" className={cn("overflow-hidden rounded-[28px] bg-[#1B1815]", className)}>
      <Link href={href} className="block">
        <div className={cn("relative", aspecto)}>
          {src && portadaOficial ? (
            <picture>
              {heroe && ancho ? <source media="(min-width: 768px)" srcSet={ancho} /> : null}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img data-obra={obraId} src={src} alt="" loading={priority ? "eager" : "lazy"} decoding="async" className="sala-portada absolute inset-0 h-full w-full object-cover" />
            </picture>
          ) : src ? (
            <Lienzo src={src} obraId={obraId} priority={priority} className="absolute inset-0 m-0" imgClassName="p-3" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1B1815]" data-hueco="marca">
              <Mark className="h-16 w-16" tono="oro" />
            </div>
          )}
          <span className="t-rotulo absolute top-3 left-3 rounded-full bg-[#100E0C]/85 px-3 py-2 text-[#F4ECE2]">{chip}</span>
        </div>
        <div className="px-5 pt-4 pb-5">
          <h3 className={cn("font-display leading-tight", heroe ? "t-h1" : "t-h3 text-2xl")}>{titulo}</h3>
          {meta ? <p className="t-meta mt-1 tabular-nums">{meta}</p> : null}
          <PuntosDia total={dias} hechos={hechos} className="mt-3" />
        </div>
      </Link>
    </article>
  );
}
