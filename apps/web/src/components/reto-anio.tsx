import Link from "next/link";
import { obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { BucleCuadro } from "@/components/bucle-cuadro";
import { Mark } from "@/components/brand";
import { HuecoAdvientoO1 } from "@/components/hueco-adviento-o1";
import { bucleDeEpisodio, bucleDeReto } from "@/lib/bucles";
import { etiquetaInicio, fechaLegible } from "@/lib/publico";
import { episodioDeCita, fechaDeDia, inicioDeTemporada, portadaConectada, portadasDeTemporada, type DiaAnio, type RangoEpisodio, type RetoAnioDato } from "@/lib/retos-anio";

function reloj(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${minutos}:${String(resto).padStart(2, "0")}`;
}

function diaPieza(lang: string, ui: "es" | "en", dia: DiaAnio, numero: number, fecha: string | null, rangos: readonly RangoEpisodio[]) {
  const pronto = ui === "en" ? "Coming soon" : "Próximamente";
  const duracion = dia.duracion_s ? reloj(dia.duracion_s) : "";
  return (
    <>
      <span className="font-display text-xl leading-tight">{numero}. {dia[ui]}</span>
      <span className="mt-1 block text-sm text-[#B7AB9C]">{[fecha ? fechaLegible(fecha, ui) : null, dia.profecia && dia.cumplimiento ? `${dia.profecia} → ${dia.cumplimiento}` : dia.cita].filter(Boolean).join(" · ")}</span>
      {dia.nota ? <span className="mt-1 block text-sm text-[#E7D7C3]">{dia.nota[ui]}</span> : null}
      {dia.relacionados && dia.relacionados.length > 0 ? (
        <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {dia.relacionados.map((id) => {
            const rango = rangos.find((item) => item.id === id);
            const etiqueta = rango ? `${id} · ${rango.rango}` : id;
            return rango ? (
              <Link key={id} href={`/${lang}/catalogo/${id}`} className="text-sm text-[#C9A96E] underline">{etiqueta}</Link>
            ) : (
              <span key={id} className="text-sm text-[#8A8175]">{etiqueta}</span>
            );
          })}
        </span>
      ) : null}
      <span className="mt-1 block text-sm text-[#8A8175]">{duracion ? `${duracion} · ${pronto}` : pronto}</span>
    </>
  );
}

export function VistaRetoAnio({ lang, reto, rangos }: { lang: string; reto: RetoAnioDato; rangos: readonly RangoEpisodio[] }) {
  const ui = lang === "en" ? "en" : "es";
  const inicio = inicioDeTemporada(reto.id);
  const fin = reto.dias.at(-1)?.fecha || null;
  const conectada = portadaConectada(reto);
  const portada = portadasDeTemporada(rangos)[reto.id];
  const obra = portada?.tipo === "episodio" ? obraDeEpisodio(portada.episodio) : null;
  const src = conectada || (portada?.tipo === "reto" ? portada.src : obra ? obraWebp(obra) : "");
  const bucle = !conectada && portada?.tipo === "reto"
    ? bucleDeReto(reto.id, portada.obraId)
    : !conectada && portada?.tipo === "episodio"
      ? bucleDeEpisodio(portada.episodio)
      : null;
  const poster = bucle?.poster || src || "";
  return (
    <main className="bg-[#100E0C] text-[#F4ECE2]">
      <div className="relative h-72 overflow-hidden bg-[#1B1815] md:h-96">
        {bucle && poster ? (
          <BucleCuadro bucle={{ ...bucle, poster, alt: bucle.alt }} priority />
        ) : src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="ken-burns h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1B1815]" data-hueco="marca">
            <Mark className="h-16 w-16" tono="oro" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/30 to-transparent" />
        <h1 className="font-display absolute right-5 bottom-5 left-5 text-[clamp(2.2rem,8vw,4.5rem)] leading-none">{reto.titulo[ui]}</h1>
      </div>
      <div className="mx-auto w-full max-w-3xl px-5 py-8 md:px-8">
        <p className="text-[#E7D7C3]">{reto.explica[ui]}</p>
        <p className="mt-3 text-sm text-[#C9A96E]">{reto.dias.length} {ui === "en" ? "days" : "días"}{inicio ? ` · ${etiquetaInicio(inicio, ui)}` : ""}{fin ? (ui === "en" ? ` · until ${fechaLegible(fin, ui)}` : ` · hasta el ${fechaLegible(fin, ui)}`) : ""}</p>
        {!reto.fijo ? <p className="mt-2 text-sm text-[#B7AB9C]">{ui === "en" ? "It can be walked in any stretch of Ordinary Time." : "Se puede recorrer en cualquier tramo de Tiempo ordinario."}</p> : null}
        {reto.id === "adviento-isaias" ? <HuecoAdvientoO1 lang={ui} /> : null}
        <ol className="mt-8 divide-y divide-[#2E2924] border-y border-[#2E2924]">
          {reto.dias.map((dia, indice) => {
            const fecha = dia.fecha ?? fechaDeDia(reto.id, indice);
            if (dia.pieza) return <li key={dia.pieza} className="aparecer py-3" style={{ ["--i" as string]: indice % 12 }}>{diaPieza(lang, ui, dia, indice + 1, fecha, rangos)}</li>;
            const episodio = episodioDeCita(dia.cita, rangos);
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
