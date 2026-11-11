import Link from "next/link";
import { obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { etiquetaInicio, fechaLegible } from "@/lib/publico";
import { episodioDeCita, fechaDeDia, inicioDeTemporada, portadasDeTemporada, type RangoEpisodio, type RetoAnioDato } from "@/lib/retos-anio";

export function VistaRetoAnio({ lang, reto, rangos }: { lang: string; reto: RetoAnioDato; rangos: readonly RangoEpisodio[] }) {
  const ui = lang === "en" ? "en" : "es";
  const inicio = inicioDeTemporada(reto.id);
  const portada = portadasDeTemporada(rangos)[reto.id];
  const obra = portada?.tipo === "episodio" ? obraDeEpisodio(portada.episodio) : null;
  const src = portada?.tipo === "reto" ? portada.src : obra ? obraWebp(obra) : null;
  return (
    <main className="bg-[#100E0C] text-[#F4ECE2]">
      <div className="relative h-72 overflow-hidden bg-[#1B1815] md:h-96">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="ken-burns h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/30 to-transparent" />
        <h1 className="font-display absolute right-5 bottom-5 left-5 text-[clamp(2.2rem,8vw,4.5rem)] leading-none">{reto.titulo[ui]}</h1>
      </div>
      <div className="mx-auto w-full max-w-3xl px-5 py-8 md:px-8">
        <p className="text-[#E7D7C3]">{reto.explica[ui]}</p>
        <p className="mt-3 text-sm text-[#C9A96E]">{reto.dias.length} {ui === "en" ? "days" : "días"}{inicio ? ` · ${etiquetaInicio(inicio, ui)}` : ""}</p>
        {!reto.fijo ? <p className="mt-2 text-sm text-[#B7AB9C]">{ui === "en" ? "It can be walked in any stretch of Ordinary Time." : "Se puede recorrer en cualquier tramo de Tiempo ordinario."}</p> : null}
        <ol className="mt-8 divide-y divide-[#2E2924] border-y border-[#2E2924]">
          {reto.dias.map((dia, indice) => {
            const episodio = episodioDeCita(dia.cita, rangos);
            const fecha = fechaDeDia(reto.id, indice);
            const meta = [fecha ? fechaLegible(fecha, ui) : null, dia.cita].filter(Boolean).join(" · ");
            const cuerpo = (
              <>
                <span className="font-display text-xl leading-tight">{indice + 1}. {dia[ui]}</span>
                <span className="mt-1 block text-sm text-[#B7AB9C]">{meta}</span>
              </>
            );
            return (
              <li key={`${reto.id}-${indice}`} className="aparecer py-3" style={{ ["--i" as string]: indice % 12 }}>
                {episodio ? (
                  <Link href={`/${lang}/catalogo/${episodio}`} className="block">{cuerpo}</Link>
                ) : (
                  <div>
                    {cuerpo}
                    <span className="mt-1 block text-sm text-[#8A8175]">{ui === "en" ? "Coming soon" : "Próximamente"}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <Link href={`/${lang}/retos`} className="mt-8 inline-flex min-h-11 items-center text-sm text-[#C9A96E] underline">{ui === "en" ? "All challenges" : "Todos los retos"}</Link>
      </div>
    </main>
  );
}
