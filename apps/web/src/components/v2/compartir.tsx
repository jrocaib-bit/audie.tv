"use client";

import { idiomaContenido, enlaceProfundo, nombreCorto, playableEpisodes } from "@audite/domain";
import { obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { useLibrary } from "@/components/library";

export function CompartirV2() {
  const library = useLibrary();
  const locale = library.settings.uiLocale;
  const es = locale === "es";
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const id = params.get("e") || playableEpisodes(library.catalog)[0]?.id || "gn-01";
  const segundo = Number(params.get("t") || "0");
  const episode = library.catalog.episodes.find((item) => item.id === id) ?? null;
  const obra = obraDeEpisodio(id);
  const enlaces = enlaceProfundo(id, segundo, locale);
  const titulo = episode ? nombreCorto(episode, locale) : obra?.titulo[idiomaContenido(locale)] ?? id;
  return (
    <main id="contenido" className="app-clear mx-auto flex w-full max-w-lg flex-col items-center px-4 pt-6">
      <h1 className="font-display self-start text-4xl leading-none">{es ? "Compartir" : "Share"}</h1>
      <article className="relative mt-4 aspect-[9/16] w-[min(100%,20rem)] overflow-hidden rounded-3xl bg-[#100E0C] text-[#F4ECE2]">
        {obra ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={obraWebp(obra)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="kicker text-[#C9A96E]">Audite</p>
          <h2 className="font-display mt-2 text-4xl leading-none">{titulo}</h2>
          <p className="font-display-regular mt-2 text-xl">{episode?.scriptureRangeLabel}</p>
        </div>
      </article>
      <button type="button" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-acento px-5 text-acento-ink" onClick={() => void navigator.clipboard?.writeText(`${window.location.origin}${enlaces.web}`)}>
        {es ? "Copiar enlace" : "Copy link"}
      </button>
    </main>
  );
}
