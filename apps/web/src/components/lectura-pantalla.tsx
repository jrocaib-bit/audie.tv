"use client";

import { capituloDePrueba, describirFuente, estadoTiempos, tiemposDeManifiesto, versiculoEnTiempo } from "@audite/domain";
import { useState } from "react";
import { useLibrary } from "@/components/library";

export function LecturaPantalla() {
  const { settings, player } = useLibrary();
  const locale = settings.uiLocale;
  const es = locale === "es";
  const fuente = describirFuente(process.env.NEXT_PUBLIC_AUDITE_TEXTO_URL);
  const [sincronizada, setSincronizada] = useState(false);
  const capitulo = capituloDePrueba("gn", 1, locale, process.env.NEXT_PUBLIC_AUDITE_TEXTO_URL);
  const tiempos = tiemposDeManifiesto(null);
  const activo = sincronizada ? versiculoEnTiempo(tiempos, player.globalTime) : null;

  return (
    <main id="contenido" className="app-clear mx-auto w-full max-w-lg px-4 pt-4">
      <h1 className="font-display text-4xl leading-none">{es ? "Lectura" : "Reading"}</h1>
      <p className="mt-3 text-sm text-muted">
        {fuente.modo === "remota-sin-conectar"
          ? (es ? "El almacén privado está nombrado y no conectado. No se descarga texto." : "The private store is named and not connected. No text is downloaded.")
          : (es ? "Ejemplar de prueba. El texto con licencia no está en este repositorio." : "Test copy. Licensed text is not in this repository.")}
      </p>
      <div className="mt-4 flex gap-2">
        <button type="button" className={`neo-chip ${sincronizada ? "" : "border-acento"}`} onClick={() => setSincronizada(false)}>{es ? "Solo lectura" : "Reading only"}</button>
        <button type="button" className={`neo-chip ${sincronizada ? "border-acento" : ""}`} onClick={() => setSincronizada(true)}>{es ? "Con el audio" : "With audio"}</button>
      </div>
      <p className="font-display mt-4 text-3xl leading-none">{es ? "Génesis 1" : "Genesis 1"}</p>
      {sincronizada ? (
        <p className="mt-2 text-sm text-muted">
          {estadoTiempos(tiempos) === "sin-tiempos"
            ? (es ? "Sin tiempos por versículo en el manifiesto. No se resalta nada." : "The manifest has no per-verse timings. Nothing is highlighted.")
            : (es ? "El versículo en curso sigue al audio." : "The current verse follows the audio.")}
        </p>
      ) : null}
      {capitulo ? (
        <ol className="mt-4 space-y-3">
          <li className="text-sm text-acento">{capitulo.aviso}</li>
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
        <p className="mt-4 text-sm">{es ? "Este capítulo no está en el ejemplar de prueba." : "This chapter is not in the test copy."}</p>
      )}
    </main>
  );
}
