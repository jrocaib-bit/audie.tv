"use client";

import { codigoSala, codigoValido } from "@audite/domain";
import { useState } from "react";
import { useLibrary } from "@/components/library";

export function JuntosV2() {
  const { settings, catalog } = useLibrary();
  const es = settings.uiLocale === "es";
  const [sala, setSala] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [unida, setUnida] = useState(false);
  const episodio = catalog.episodes[0];
  return (
    <main id="contenido" className="app-clear mx-auto w-full max-w-lg px-4 pt-4">
      <h1 className="font-display text-4xl leading-none">{es ? "Juntos" : "Together"}</h1>
      <section className="neo-card mt-4 p-4">
        <p className="font-display text-5xl tracking-widest">{sala ?? "————"}</p>
        <button type="button" className="mt-4 inline-flex min-h-12 items-center rounded-full bg-acento px-5 text-acento-ink" onClick={() => setSala(codigoSala(`${Date.now()}`))}>
          {es ? "Abrir sala" : "Open a room"}
        </button>
      </section>
      <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); setUnida(codigoValido(codigo)); }}>
        <input value={codigo} onChange={(event) => setCodigo(event.target.value.toUpperCase())} maxLength={6} placeholder={es ? "Código" : "Code"} className="neo-card min-h-12 min-w-0 flex-1 bg-transparent px-4 tracking-widest outline-none" />
        <button type="submit" className="min-h-12 shrink-0 rounded-full border border-border px-4">{es ? "Unirme" : "Join"}</button>
      </form>
      {unida || sala ? (
        <section className="neo-card mt-4 p-4">
          <p className="kicker text-muted">{es ? "Ahora" : "Now"}</p>
          <p className="font-display mt-2 text-3xl leading-none">{episodio ? episodio.title : "Audite"}</p>
          <p className="mt-4 text-sm text-muted">{es ? "Tú" : "You"}</p>
        </section>
      ) : null}
    </main>
  );
}
