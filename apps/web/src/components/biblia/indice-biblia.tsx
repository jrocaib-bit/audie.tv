import { indiceCapitulos } from "@audite/content/indice-capitulos";
import {
  destinosDeCapitulo,
  episodioDelLibro,
  hrefDeCapitulo,
  nombreDeCapitulo,
  type CapituloIndice,
  type LibroIndice,
} from "@audite/domain";
import Link from "next/link";
import { LibroDesplegable } from "@/components/biblia/libro-desplegable";
import { FiltroCatalogo } from "@/components/movimiento";
import { BotonOro } from "@/components/sala/boton-oro";
import { copiaSitio, type SitioCopy } from "@/sitio/i18n";
import "./biblia.css";

type Ui = "es" | "en";

const CELDA = "flex min-h-11 min-w-11 items-center justify-center rounded-lg text-base tabular-nums";

function Capitulo({ lang, ui, libro, capitulo, copy }: { lang: string; ui: Ui; libro: LibroIndice; capitulo: CapituloIndice; copy: SitioCopy }) {
  const destinos = destinosDeCapitulo(capitulo);
  const nombre = nombreDeCapitulo(libro, capitulo.n, ui);
  if (destinos.length === 0) {
    return (
      <li>
        <span className={`${CELDA} border border-dashed border-[#2E2924] text-[#B7AB9C]`}>
          <span aria-hidden="true">{capitulo.n}</span>
          <span className="sr-only">{`${nombre}. ${copy.pending}`}</span>
        </span>
      </li>
    );
  }
  if (destinos.length > 1) {
    return (
      <li className="col-span-full rounded-lg border border-[#2E2924] p-2" data-varios="">
        <p className="text-sm text-[#B7AB9C]">
          {nombre}. {copy.bibleSeveral}
        </p>
        <ul className="mt-1 flex flex-wrap gap-2">
          {destinos.map((destino) => (
            <li key={destino.id}>
              <Link href={hrefDeCapitulo(lang, destino)} className={`${CELDA} bg-[#2E2924] px-3 hover:bg-[#E0C48A] hover:text-[#100E0C]`}>
                {episodioDelLibro(libro, destino.id)?.titulo_corto[ui] ?? destino.id}
              </Link>
            </li>
          ))}
        </ul>
      </li>
    );
  }
  const destino = destinos[0]!;
  const unido = capitulo.unido;
  return (
    <li>
      <Link href={hrefDeCapitulo(lang, destino)} aria-label={unido ? `${nombre}. ${unido.nota[ui]}` : nombre} data-unido={unido ? String(unido.con) : undefined}>
        {capitulo.n}
      </Link>
    </li>
  );
}

function Libro({ lang, ui, libro, copy }: { lang: string; ui: Ui; libro: LibroIndice; copy: SitioCopy }) {
  const nombre = libro.titulo[ui];
  const total = libro.capitulos.length;
  const uniones = libro.capitulos.filter((capitulo) => capitulo.unido);
  return (
    <LibroDesplegable
      nombre={nombre}
      detalle={`${total} ${total === 1 ? copy.bibleChapter : copy.bibleChapters}`}
      testamento={libro.testamento}
      busqueda={`${libro.titulo.es} ${libro.titulo.en} ${libro.id}`}
    >
      <ul aria-label={`${copy.bibleChaptersOf} ${nombre}`} className="biblia-capitulos" data-capitulos={libro.id}>
        {libro.capitulos.map((capitulo) => (
          <Capitulo key={capitulo.n} lang={lang} ui={ui} libro={libro} capitulo={capitulo} copy={copy} />
        ))}
      </ul>
      {uniones.map((capitulo) => {
        const episodio = episodioDelLibro(libro, capitulo.unido!.episodio);
        return (
          <p key={capitulo.n} className="mt-3 max-w-xl text-sm text-[#B7AB9C]" data-nota-union={capitulo.n}>
            {capitulo.unido!.nota[ui]} {copy.bibleListenIn}{" "}
            <Link href={hrefDeCapitulo(lang, { id: capitulo.unido!.episodio })} className="inline-flex min-h-11 items-center text-[#E0C48A] underline underline-offset-4">
              {episodio?.titulo_corto[ui] ?? capitulo.unido!.episodio}
            </Link>
          </p>
        );
      })}
    </LibroDesplegable>
  );
}

function Prueba({ id, lang, copy }: { id: string; lang: string; copy: SitioCopy }) {
  return (
    <section aria-labelledby={id} data-prueba="" className="mt-8 rounded-2xl border border-[#2E2924] bg-[#1B1815] p-5 md:flex md:items-center md:justify-between md:gap-6">
      <div>
        <h2 id={id} className="font-display text-2xl">{copy.bibleCtaTitle}</h2>
        <p className="mt-1 text-[#B7AB9C]">{copy.bibleCtaBody}</p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 md:mt-0 md:shrink-0">
        <BotonOro asChild>
          <Link href={`/${lang}/membresia`}>{copy.homeCta}</Link>
        </BotonOro>
        <Link href={`/${lang}/entrar`} className="inline-flex min-h-11 items-center text-[#F4ECE2] underline underline-offset-4">
          {copy.ctaSign}
        </Link>
      </div>
    </section>
  );
}

export function SitioBiblia({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  if (!copy) return null;
  const ui: Ui = lang === "en" ? "en" : "es";
  const indice = indiceCapitulos();
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8" data-indice-biblia="">
      <h1 className="font-display text-5xl">{copy.bibleTitle}</h1>
      <p className="mt-4 max-w-xl text-lg text-[#B7AB9C]">{copy.bibleIntro}</p>
      <Prueba id="biblia-prueba" lang={lang} copy={copy} />
      <FiltroCatalogo
        etiqueta={copy.bibleTestament}
        todos={copy.bibleAll}
        antiguo={indice.testamentos[0]!.titulo[ui]}
        nuevo={indice.testamentos[1]!.titulo[ui]}
        buscar={copy.bibleFind}
      >
        {indice.testamentos.map((testamento) => (
          <section key={testamento.id} className="mt-10" data-bloque="" data-testamento={testamento.id} aria-labelledby={`biblia-${testamento.id}`}>
            <h2 id={`biblia-${testamento.id}`} className="font-display text-3xl">{testamento.titulo[ui]}</h2>
            {testamento.secciones.map((seccion) => (
              <section key={seccion.id} className="mt-6" data-bloque="" aria-labelledby={`biblia-${seccion.id}`}>
                <h3 id={`biblia-${seccion.id}`} className="t-rotulo text-[#B7AB9C]">{seccion.titulo[ui]}</h3>
                <ul className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {seccion.libros.map((libro) => (
                    <Libro key={libro.id} lang={lang} ui={ui} libro={libro} copy={copy} />
                  ))}
                </ul>
              </section>
            ))}
          </section>
        ))}
      </FiltroCatalogo>
    </main>
  );
}
