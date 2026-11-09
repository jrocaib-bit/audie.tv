"use client";

import { capituloDePrueba, tiemposDeManifiesto, versiculoEnTiempo } from "@audite/domain";
import { useState } from "react";
import { useLibrary } from "@/components/library";

export function LecturaPantalla() {
  const { settings, player } = useLibrary();
  const locale = settings.uiLocale;
  const es = locale === "es";
  const [sincronizada, setSincronizada] = useState(false);
  const capitulo = capituloDePrueba("gn", 1, locale, process.env.NEXT_PUBLIC_AUDITE_TEXTO_URL);
  const tiempos = tiemposDeManifiesto(null);
  const activo = sincronizada ? versiculoEnTiempo(tiempos, player.globalTime) : null;

  return (
    <main id="contenido" className="app-clear mx-auto w-full max-w-lg px-4 pt-4">
      <h1 className="font-display text-4xl leading-none">{es ? "Lectura" : "Reading"}</h1>
      <div className="mt-4 flex gap-2">
        <button type="button" className={`neo-chip ${sincronizada ? "" : "border-acento"}`} onClick={() => setSincronizada(false)}>{es ? "Solo lectura" : "Reading only"}</button>
        <button type="button" className={`neo-chip ${sincronizada ? "border-acento" : ""}`} onClick={() => setSincronizada(true)}>{es ? "Con el audio" : "With audio"}</button>
      </div>
      <p className="font-display mt-4 text-3xl leading-none">{es ? "Génesis 1" : "Genesis 1"}</p>
      {capitulo ? (
        <ol className="mt-4 space-y-3">
          {capitulo.versiculos.map((versiculo) => {
            const marcado = activo?.capitulo === versiculo.capitulo && activo.versiculo === versiculo.versiculo;
            return (
              <li key={versiculo.versiculo} className={`rounded-2xl px-3 py-2 ${marcado ? "bg-acento/15" : ""}`}>
                <span className="cifra mr-2 text-lg text-acento">{versiculo.versiculo}</span>
                <span>{versiculo.texto}</span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-4 text-sm">{es ? "Pronto" : "Soon"}</p>
      )}
    </main>
  );
}
