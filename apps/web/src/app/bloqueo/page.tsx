"use client";

import { metadatosReproduccion, nombreCorto, playableEpisodes } from "@audite/domain";
import { obraDeEpisodio, obraWebp, rotuloObra } from "@audite/content/obras";
import { TarjetaBloqueo } from "@/components/reproductor";
import { useLibrary } from "@/components/library";

export default function Page() {
  const { catalog, settings, player } = useLibrary();
  const locale = settings.uiLocale;
  const episode = playableEpisodes(catalog)[0] ?? null;
  const obra = obraDeEpisodio(episode?.id ?? "gn-01");
  const meta = metadatosReproduccion({
    titulo: episode ? nombreCorto(episode, locale) : obra ? rotuloObra(obra, locale) : "Audite",
    libro: episode?.scriptureRangeLabel ?? (obra ? rotuloObra(obra, locale) : ""),
    caratula: obra ? obraWebp(obra) : null,
    duracion: episode?.durationSeconds ?? 0,
    posicion: player.globalTime,
    velocidad: player.rate,
  });
  return (
    <main id="contenido" className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center bg-[#100E0C] px-4 py-8">
      <p className="text-sm text-[#B7AB9C]">{locale === "en" ? "Simulated from the system metadata. CarPlay and Android Auto need a developer account." : "Simulación con los metadatos del sistema. CarPlay y Android Auto piden cuenta de desarrollador."}</p>
      <TarjetaBloqueo meta={meta} sonando={player.status === "playing"} locale={locale} />
    </main>
  );
}
