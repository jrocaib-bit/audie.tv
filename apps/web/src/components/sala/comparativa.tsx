import { PANTALLA_MOVIL } from "./contexto-reportaje";
import type { ComparativaSala } from "@/lib/sala-contexto";

/**
 * Comparativa de imágenes ajenas a la obra (genérica: src, pie, crédito). Imágenes lazy, con su tamaño para no saltar.
 * Los créditos van en su propio bloque `data-creditos`. Sin imágenes completas o sin créditos no se pinta nada.
 */
export function Comparativa({ datos }: { datos?: ComparativaSala | null }) {
  const imagenes = (datos?.imagenes ?? []).filter((i) => i.src && i.pie && i.ancho > 0 && i.alto > 0);
  if (!datos || !imagenes.length || !datos.creditos) return null;
  return (
    <section data-comparativa data-pantalla aria-label={datos.entrada} className={`grid gap-4 md:py-10 ${PANTALLA_MOVIL}`}>
      <p className="font-display text-2xl leading-snug md:text-3xl">{datos.entrada}</p>
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-5">
        {imagenes.map((i) => (
          <figure key={i.src} className="grid gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={i.src} alt={i.alt} width={i.ancho} height={i.alto} loading="lazy" decoding="async" className="h-auto w-full rounded-md bg-[#1B1815]" />
            <figcaption className="text-[1.0625rem] leading-[1.55] text-[#E7D7C3] md:text-base md:leading-snug">{i.pie}</figcaption>
          </figure>
        ))}
      </div>
      <p data-creditos className="text-base leading-[1.55] text-[#C9BDAD] md:text-sm md:leading-snug md:text-[#B7AB9C]">{datos.creditos}</p>
    </section>
  );
}
