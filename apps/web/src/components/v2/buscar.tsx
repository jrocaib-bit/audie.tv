"use client";

import { PERSONAJES, TEMAS, buscar, mixesDeHora } from "@audite/domain";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLibrary } from "@/components/library";
import { TarjetaCuadro } from "@/components/v2/fichas";

const CATEGORIAS = [
  { id: "libros", es: "Libros", en: "Books", color: "#1E3A34" },
  { id: "temas", es: "Temas", en: "Themes", color: "#3D2B1F" },
  { id: "personajes", es: "Personajes", en: "People", color: "#4A2C3A" },
  { id: "momentos", es: "Momentos", en: "Moments", color: "#2C3348" },
  { id: "idiomas", es: "Idiomas", en: "Languages", color: "#5A4632" },
] as const;

export function BuscarV2() {
  const library = useLibrary();
  const { catalog, settings } = library;
  const locale = settings.uiLocale;
  const es = locale === "es";
  const [consulta, setConsulta] = useState("");
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS)[number]["id"] | null>(null);
  const resultado = useMemo(() => buscar(consulta, locale), [consulta, locale]);
  const vacio = consulta.trim().length === 0;
  const ahora = useMemo(() => new Date(), []);
  const dia = Math.floor((ahora.getTime() - new Date(ahora.getFullYear(), 0, 0).getTime()) / 86400000);
  const momentos = mixesDeHora(ahora.getHours(), dia, locale);
  return (
    <main id="contenido" className="app-clear px-4 pt-4">
      <h1 className="font-display text-4xl leading-none">{es ? "Buscar" : "Search"}</h1>
      <input value={consulta} onChange={(event) => setConsulta(event.target.value)} placeholder={es ? "Pasaje, persona, tema" : "Passage, person, theme"} className="neo-card mt-4 min-h-12 w-full bg-transparent px-4 outline-none" aria-label={es ? "Buscar" : "Search"} />
      {vacio ? (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIAS.map((item) => (
              <button key={item.id} type="button" className="flex min-h-24 items-end rounded-2xl p-3 text-left font-display text-xl leading-none text-[#F4ECE2]" style={{ background: item.color }} onClick={() => setCategoria(item.id)}>
                {es ? item.es : item.en}
              </button>
            ))}
          </div>
          {categoria ? (
            <div className="mt-5">
              <button type="button" className="kicker text-muted" onClick={() => setCategoria(null)}>{es ? "Cerrar" : "Close"}</button>
              {categoria === "libros" ? (
                <ul className="mt-2">{catalog.books.slice(0, 16).map((libro) => <li key={libro.id}><Link className="flex min-h-12 items-center font-display text-2xl" href={`/libro/${libro.id}`}>{libro.name[locale] || libro.name.es}</Link></li>)}</ul>
              ) : null}
              {categoria === "temas" ? (
                <ul className="mt-2">{TEMAS.map((tema) => <li key={tema.id}><Link className="flex min-h-12 items-center font-display text-2xl" href={`/tema/${tema.id}`}>{tema.titulo[locale]}</Link></li>)}</ul>
              ) : null}
              {categoria === "personajes" ? (
                <ul className="mt-2">{PERSONAJES.map((persona) => <li key={persona.id}><Link className="flex min-h-12 items-center font-display text-2xl" href={`/personaje/${persona.id}`}>{persona.titulo[locale]}</Link></li>)}</ul>
              ) : null}
              {categoria === "momentos" ? (
                <ul className="mt-2">{momentos.map((mix) => <li key={mix.id}><Link className="flex min-h-12 items-center font-display text-2xl" href={mix.href}>{mix.titulo}</Link></li>)}</ul>
              ) : null}
              {categoria === "idiomas" ? (
                <div className="mt-3 flex gap-2">
                  <button type="button" className={`neo-chip ${locale === "es" ? "bg-acento text-acento-ink" : ""}`} onClick={() => library.updateSettings({ uiLocale: "es" })}>Español</button>
                  <button type="button" className={`neo-chip ${locale === "en" ? "bg-acento text-acento-ink" : ""}`} onClick={() => library.updateSettings({ uiLocale: "en" })}>English</button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {resultado.pasaje ? (
            <section>
              <h2 className="kicker text-muted">{es ? "Pasaje" : "Passage"}</h2>
              <Link href={`/libro/${resultado.pasaje.libroId}?c=${resultado.pasaje.capitulo}&v=${resultado.pasaje.versiculo}`} className="font-display mt-2 block text-3xl leading-none">{resultado.pasaje.etiqueta.replace(resultado.pasaje.libroId, catalog.books.find((libro) => libro.id === resultado.pasaje?.libroId)?.name[locale] || resultado.pasaje.libroId)} {resultado.pasaje.capitulo}:{resultado.pasaje.versiculo}</Link>
            </section>
          ) : null}
          {resultado.libros.length > 0 ? (
            <section>
              <h2 className="kicker text-muted">{es ? "Libros" : "Books"}</h2>
              <div className="estante mt-3 flex gap-3 overflow-x-auto">
                {resultado.libros.map((id) => (
                  <TarjetaCuadro key={id} href={`/libro/${id}`} episodioId={`${id}-01`} titulo={catalog.books.find((libro) => libro.id === id)?.name[locale] || id} pronto={false} prontoTexto="Pronto" />
                ))}
              </div>
            </section>
          ) : null}
          {resultado.personajes.length > 0 ? (
            <section>
              <h2 className="kicker text-muted">{es ? "Personajes" : "People"}</h2>
              <ul className="mt-2">{resultado.personajes.map((persona) => <li key={persona.id}><Link className="flex min-h-12 items-center font-display text-2xl" href={`/personaje/${persona.id}`}>{persona.titulo[locale]}</Link></li>)}</ul>
            </section>
          ) : null}
          {resultado.temas.length > 0 ? (
            <section>
              <h2 className="kicker text-muted">{es ? "Temas" : "Themes"}</h2>
              <ul className="mt-2">{resultado.temas.map((tema) => <li key={tema.id}><Link className="flex min-h-12 items-center font-display text-2xl" href={`/tema/${tema.id}`}>{tema.titulo[locale]}</Link></li>)}</ul>
            </section>
          ) : null}
        </div>
      )}
    </main>
  );
}
