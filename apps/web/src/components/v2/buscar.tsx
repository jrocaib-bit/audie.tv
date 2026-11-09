"use client";

import { PERSONAJES, TEMAS, buscar } from "@audite/domain";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLibrary } from "@/components/library";
import { TarjetaCuadro } from "@/components/v2/fichas";

export function BuscarV2() {
  const { catalog, settings } = useLibrary();
  const locale = settings.uiLocale;
  const es = locale === "es";
  const [consulta, setConsulta] = useState("");
  const resultado = useMemo(() => buscar(consulta, locale), [consulta, locale]);
  const vacio = consulta.trim().length === 0;
  return (
    <main id="contenido" className="app-clear px-4 pt-4">
      <h1 className="font-display text-4xl leading-none">{es ? "Buscar" : "Search"}</h1>
      <input value={consulta} onChange={(event) => setConsulta(event.target.value)} placeholder={es ? "Pasaje, persona, tema" : "Passage, person, theme"} className="neo-card mt-4 min-h-12 w-full bg-transparent px-4 outline-none" aria-label={es ? "Buscar" : "Search"} />
      {vacio ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[...TEMAS, ...PERSONAJES].map((item) => (
            <Link key={item.id} href={"libroId" in item && TEMAS.some((tema) => tema.id === item.id) ? `/tema/${item.id}` : `/personaje/${item.id}`} className="flex min-h-24 items-end rounded-2xl p-3 font-display text-xl leading-none text-[#F4ECE2]" style={{ background: item.color }}>
              {item.titulo[locale]}
            </Link>
          ))}
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
