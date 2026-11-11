import { loadAppCatalog } from "@audite/content/app-catalog";
import { audioListo } from "@audite/content/audio-listo";
import { obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { textosAlta } from "@audite/domain";
import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { ObraFoto, Placa } from "@/components/placa";
import { CtaPar } from "@/components/conversion";
import { RecordarIdioma, SelectorIdioma } from "@/components/selector-idioma";
import { agruparLibros } from "@/lib/publico";
import { palabras } from "@/lib/movimiento";
import { BarraPersistente, CompactarCabecera, FiltroCatalogo } from "@/components/movimiento";
import { BotonProbar, ProbarAudio } from "@/components/probar";
import { etiquetaInicio } from "@/lib/publico";
import { idsDePrueba, inicioDeTemporada, retosDeTemporada } from "@/lib/retos-anio";
import { tiendasVisibles } from "@/lib/tiendas-app";
import { PaywallWeb } from "@/components/paywall-web";
import { EnlaceSoporte } from "@/components/enlace-soporte";
import { FormularioBoletin } from "@/components/formularios";
import { marcaFormulario } from "@/lib/formularios/acciones";
import { copiaSitio, type SitioCopy } from "@/sitio/i18n";

function idiomaUi(lang: string): "es" | "en" {
  return lang === "en" ? "en" : "es";
}

export function etiquetaEntrar(google: boolean, corta: string, conGoogle: string): string {
  return google ? conGoogle : corta;
}

export async function MarcoSitio({ lang, children, sobreObra = false, novedades = true }: { lang: string; children: ReactNode; sobreObra?: boolean; novedades?: boolean }) {
  const copy = copiaSitio(lang);
  if (!copy) return children;
  const pie = await SitioPie({ lang, novedades });
  return (
    <>
      <SitioHeader lang={lang} copy={copy} sobreObra={sobreObra} />
      {children}
      {pie}
      <BarraPersistente />
    </>
  );
}

export function SitioHeader({ lang, copy, sobreObra = false }: { lang: string; copy: SitioCopy; sobreObra?: boolean }) {
  const ui = idiomaUi(lang);
  return (
    <header data-cabecera="" className={sobreObra ? "cabecera cabecera-obra inset-x-0 top-0 z-20" : "cabecera"}>
      <CompactarCabecera />
      <div className="cabecera-interior mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link href={`/${lang}`} className="inline-flex min-h-11 items-center">
          <Wordmark locale={ui} tono="blanco" className="h-8 w-auto md:h-9" />
        </Link>
        <nav className="flex items-center gap-4 text-sm text-[#F4ECE2]">
          <Link href={`/${lang}`} className="inline-flex min-h-11 items-center">
            {copy.navHome}
          </Link>
          <Link href={`/${lang}/catalogo`} className="inline-flex min-h-11 items-center">
            {copy.navCatalog}
          </Link>
          <Link href={`/${lang}/retos`} className="inline-flex min-h-11 items-center">
            {ui === "en" ? "Challenges" : "Retos"}
          </Link>
          <Link href={`/${lang}/app`} className="hidden min-h-11 items-center md:inline-flex">
            App
          </Link>
          <Link href={`/${lang}/entrar`} className="inline-flex min-h-11 items-center">
            {etiquetaEntrar(process.env.GOOGLE_LOGIN_ENABLED === "true", copy.ctaSign, copy.ctaGhost)}
          </Link>
          <SelectorIdioma lang={lang} claro={sobreObra} />
        </nav>
      </div>
    </header>
  );
}

export async function SitioPie({ lang, novedades = true }: { lang: string; novedades?: boolean }) {
  const copy = copiaSitio(lang);
  const marca = await marcaFormulario();
  const ui = idiomaUi(lang);
  const legal = textosAlta(lang);
  if (!copy) return null;
  return (
    <footer className="bg-[#100E0C] text-[#F4ECE2]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 md:grid-cols-4 md:px-8">
        <div>
          <p className="text-sm text-[#B7AB9C]">{ui === "en" ? "Language" : "Idioma"}</p>
          <SelectorIdioma lang={lang} claro />
        </div>
        <div className="grid content-start gap-2">
          <p className="text-sm text-[#B7AB9C]">Audite</p>
          <Link href={`/${lang}`} className="inline-flex min-h-11 items-center">{copy.navHome}</Link>
          <Link href={`/${lang}/catalogo`} className="inline-flex min-h-11 items-center">{copy.navCatalog}</Link>
          <Link href={`/${lang}/retos`} className="inline-flex min-h-11 items-center">{ui === "en" ? "Challenges" : "Retos"}</Link>
          <Link href={`/${lang}/app`} className="inline-flex min-h-11 items-center">App</Link>
        </div>
        <div className="grid content-start gap-2">
          <p className="text-sm text-[#B7AB9C]">{ui === "en" ? "Help" : "Ayuda"}</p>
          <Link href="/ayuda" className="inline-flex min-h-11 items-center">{ui === "en" ? "Help" : "Ayuda"}</Link>
          <Link href={`/${lang}/contacto`} className="inline-flex min-h-11 items-center">{ui === "en" ? "Contact" : "Contacto"}</Link>
          <Link href={`/${lang}/creditos`} className="inline-flex min-h-11 items-center">{ui === "en" ? "Credits" : "Créditos"}</Link>
          <EnlaceSoporte idioma={lang} className="inline-flex min-h-11 items-center">soporte@audite.tv</EnlaceSoporte>
          <p className="text-sm text-[#B7AB9C]">La voz y la música están generadas con IA.</p>
          <Link href={`/${lang}/membresia`} className="inline-flex min-h-11 items-center">{copy.navMembership}</Link>
        </div>
        <div className="grid content-start gap-2">
          <p className="text-sm text-[#B7AB9C]">Legal</p>
          <Link href={`/${lang}/condiciones`} className="inline-flex min-h-11 items-center">{legal.condiciones}</Link>
          <Link href={`/${lang}/privacidad`} className="inline-flex min-h-11 items-center">{legal.privacidad}</Link>
          <Link href="/aviso-legal" className="inline-flex min-h-11 items-center">Aviso legal</Link>
        </div>
      </div>
      <div className="px-5 md:px-8">
        {novedades ? <FormularioBoletin marca={marca} idioma={lang} /> : null}
        <CtaPar lang={lang} etiqueta={copy.homeCta} ghost={etiquetaEntrar(process.env.GOOGLE_LOGIN_ENABLED === "true", copy.ctaSign, copy.ctaGhost)} />
      </div>
      <div className="wordmark-sangre" aria-hidden="true">
        <p className="font-display text-[#F4ECE2]">AUDITE</p>
      </div>
    </footer>
  );
}

function tituloDe(id: string, ui: "es" | "en"): string {
  const catalogo = loadAppCatalog();
  const episodio = catalogo.episodes.find((item) => item.id === id) ?? catalogo.pendientes.find((item) => item.id === id);
  return episodio?.tituloCorto?.[ui] || episodio?.titulo?.[ui] || obraDeEpisodio(id)?.titulo[ui] || id;
}

function Ctas({ lang, copy, ficha }: { lang: string; copy: NonNullable<ReturnType<typeof copiaSitio>>; ficha: { id: string; titulo: string } }) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <BotonProbar ficha={ficha} etiqueta={copy.listenFree} className="boton inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]" />
      <Link href={`/${lang}/entrar`} className="boton inline-flex min-h-12 items-center rounded-full border border-[#F4ECE2]/30 px-6">{copy.homeCta}</Link>
    </div>
  );
}

export function SitioHome({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  const ui = idiomaUi(lang);
  const portada = obraDeEpisodio("gn-01");
  const catalogo = loadAppCatalog();
  if (!copy || !portada) return null;
  const listos = new Set(audioListo().episodios.map((episodio) => episodio.id));
  const prueba = idsDePrueba(catalogo.rangos, listos).map((id) => ({ id, titulo: tituloDe(id, ui), src: obraDeEpisodio(id) ? obraWebp(obraDeEpisodio(id)!) : "" }));
  const genesis = prueba.find((episodio) => episodio.id === "gn-01") ?? { id: "gn-01", titulo: tituloDe("gn-01", ui) };
  const adviento = retosDeTemporada().find((reto) => reto.id === "adviento-isaias");
  const inicioAdviento = adviento ? inicioDeTemporada(adviento.id) : null;
  const tiendas = tiendasVisibles();
  const funciones = [copy.appPaths, copy.appStreak, copy.appReminder, copy.appDownloads, copy.appLanguages];
  const preguntas = [
    [copy.faqWhatQ, copy.faqWhatA],
    [copy.faqPriceQ, copy.faqPriceA],
    [copy.faqTrialQ, copy.faqTrialA],
    [copy.faqCancelQ, copy.faqCancelA],
    [copy.faqLangQ, copy.faqLangA],
  ] as const;
  const cifras = [
    [`${catalogo.rangos.length}`, copy.statEpisodes],
    [`${catalogo.books.length}`, copy.statBooks],
    ["10", copy.statMinutes],
    ["2026", copy.statYear],
  ];
  return (
    <>
      <RecordarIdioma />
      <ProbarAudio>
        <main className="bg-[#100E0C] text-[#F4ECE2]">
          <section id="hero" className="relative min-h-[100svh] bg-[#100E0C]">
            <div className="absolute inset-0 overflow-hidden">
              <ObraFoto obra={portada} priority className="parallax-obra h-full w-full object-cover" />
            </div>
            <div className="velo-luz absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(201_169_110/0.22),transparent_46%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/55 to-[#100E0C]/20" />
            <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-5 pt-28 pb-16 md:px-8">
              <h1 className="font-display max-w-4xl text-[clamp(2.6rem,8vw,6rem)] leading-[0.95]">{copy.homeTitle.split("\n").map((linea) => <span key={linea} className="block">{palabras(linea).map((palabra, indice) => <span key={`${linea}-${palabra}-${indice}`} className="palabra" style={{ animationDelay: `${indice * 70}ms` }}>{palabra}</span>)}</span>)}</h1>
              <p className="mt-5 max-w-xl text-lg">{copy.homeWhat}</p>
              <Ctas lang={lang} copy={copy} ficha={genesis} />
            </div>
          </section>
          <section className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4 md:px-8">
            {cifras.map(([numero, etiqueta], indice) => (
              <article key={etiqueta} className="aparecer rounded-3xl border border-[#2E2924] px-5 py-6" style={{ ["--i" as string]: indice }}>
                <p className="font-display text-5xl leading-none text-[#C9A96E] tabular-nums">{numero}</p>
                <p className="mt-3 text-[#E7D7C3]">{etiqueta}</p>
              </article>
            ))}
            <p className="text-sm text-[#B7AB9C] sm:col-span-2 lg:col-span-4">{copy.voiceAi}</p>
          </section>
          <section className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
            <h2 className="font-display text-4xl">{copy.tryTitle}</h2>
            <ul className="carrusel mt-6">
              {prueba.map((episodio) => (
                <li key={episodio.id} className="overflow-hidden rounded-3xl bg-[#1B1815]">
                  <span className="relative block aspect-[4/5] overflow-hidden">
                    {episodio.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={episodio.src} alt="" width={960} height={1200} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="block px-4 py-4">
                    <span className="block font-display text-xl leading-tight">{episodio.titulo}</span>
                    <BotonProbar ficha={episodio} etiqueta={copy.listenFree} className="boton mt-3 inline-flex min-h-11 items-center text-sm text-[#C9A96E]" />
                  </span>
                </li>
              ))}
            </ul>
            <Ctas lang={lang} copy={copy} ficha={genesis} />
          </section>
          <section className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-12 md:grid-cols-2 md:px-8">
            <article className="rounded-3xl bg-[#1B1815] px-6 py-8">
              <h2 className="font-display text-4xl leading-tight">{copy.mainChallenge}</h2>
              <p className="mt-3 text-[#E7D7C3]">{catalogo.rangos.length} {copy.statEpisodes}</p>
              <Link href={`/${lang}/retos`} className="boton mt-6 inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{copy.ctaAdvent}</Link>
            </article>
            {adviento ? (
              <article className="rounded-3xl border border-[#2E2924] px-6 py-8">
                <h2 className="font-display text-4xl leading-tight">{adviento.titulo[ui]}</h2>
                <p className="mt-3 text-[#E7D7C3]">{adviento.explica[ui]}</p>
                {inicioAdviento ? <p className="mt-2 text-sm text-[#C9A96E]">{etiquetaInicio(inicioAdviento, ui)}</p> : null}
                <Link href={`/${lang}/retos/${adviento.id}`} className="boton mt-6 inline-flex min-h-12 items-center rounded-full border border-[#C9A96E] px-6 text-[#C9A96E]">{copy.ctaAdvent}</Link>
              </article>
            ) : null}
          </section>
          <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-12 md:grid-cols-[16rem_1fr] md:px-8">
            <div className="telefono mx-auto" aria-hidden="true">
              <div className="pantalla relative aspect-[9/16]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={obraWebp(portada)} alt="" className="ken-burns absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#100E0C] p-4">
                  <p className="font-display text-2xl">{copy.appStreak}</p>
                  <p className="font-display text-5xl text-[#C9A96E]">7</p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="font-display text-4xl">{copy.appTitle}</h2>
              <ul className="mt-6 grid gap-3">
                {funciones.map((funcion) => <li key={funcion} className="rounded-2xl border border-[#2E2924] px-4 py-3">{funcion}</li>)}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                {tiendas ? (
                  <>
                    <a className="boton inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]" href={tiendas.apple}>App Store</a>
                    <a className="boton inline-flex min-h-12 items-center rounded-full border border-[#F4ECE2]/30 px-6" href={tiendas.google}>Google Play</a>
                  </>
                ) : (
                  <>
                    <Link href={`/${lang}/app#aviso`} className="boton inline-flex min-h-12 items-center rounded-full border border-[#F4ECE2]/30 px-6">App Store · {copy.storeSoon}</Link>
                    <Link href={`/${lang}/app#aviso`} className="boton inline-flex min-h-12 items-center rounded-full border border-[#F4ECE2]/30 px-6">Google Play · {copy.storeSoon}</Link>
                  </>
                )}
              </div>
            </div>
          </section>
          <section className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
            <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr]">
              <article className="rounded-3xl border border-[#C9A96E] px-6 py-8">
                <p className="text-sm text-[#C9A96E]">{copy.priceSave}</p>
                <p className="font-display mt-2 text-6xl">{copy.priceYear}</p>
              </article>
              <article className="rounded-3xl border border-[#2E2924] px-6 py-8">
                <p className="font-display mt-6 text-4xl">{copy.priceMonth}</p>
              </article>
            </div>
            <p className="mt-4 text-[#B7AB9C]">{copy.ctaRisk}</p>
            <Ctas lang={lang} copy={copy} ficha={genesis} />
          </section>
          <section className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8">
            {preguntas.map(([pregunta, respuesta]) => (
              <details key={pregunta} className="border-b border-[#2E2924] py-4">
                <summary className="min-h-11 cursor-pointer font-display text-2xl">{pregunta}</summary>
                <p className="mt-3 text-[#E7D7C3]">{respuesta}</p>
              </details>
            ))}
            <div className="mt-10">
              <Ctas lang={lang} copy={copy} ficha={genesis} />
            </div>
          </section>
        </main>
      </ProbarAudio>
    </>
  );
}

export function SitioCatalogo({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  const catalogo = loadAppCatalog();
  if (!copy) return null;
  const ui = idiomaUi(lang);
  const grupos = agruparLibros(catalogo.books);
  const cuenta = (id: string) => catalogo.rangos.filter((episodio) => episodio.bookId === id).length;
  const bloque = (titulo: string, testamento: "at" | "nt", libros: typeof grupos.at) => (
    <section className="mt-10" data-bloque="" data-testamento={testamento}>
      <h2 className="font-display text-3xl">{titulo}</h2>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {libros.map((libro, indice) => {
          const idPortada = libro.id === "sal" ? "sal-001" : `${libro.id}-01`;
          const obra = obraDeEpisodio(idPortada);
          const nombre = libro.name[ui] || libro.name.es;
          const total = cuenta(libro.id);
          return (
            <li key={libro.id} className="aparecer h-full" data-libro="" data-nombre={nombre} data-testamento={testamento} style={{ ["--i" as string]: indice }}>
              <Link href={`/${lang}/libro/${libro.id}`} className="tarjeta-libro flex h-full flex-col overflow-hidden rounded-2xl bg-[#1B1815]" style={{ viewTransitionName: `libro-${libro.id}` }}>
                <span className="marco-obra relative block w-full shrink-0 overflow-hidden bg-[#1B1815]" style={{ aspectRatio: "4 / 5" }}>
                  {obra ? <ObraFoto obra={obra} className="absolute inset-0 h-full w-full object-cover" /> : (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#241F1A]">
                      <span className="font-display text-4xl text-[#C9A96E]" aria-hidden="true">{nombre.replace(/^\d+\s*/, "").slice(0, 1)}</span>
                    </span>
                  )}
                </span>
                <span className="block px-3 py-3">
                  <span className="block font-display text-lg leading-tight">{nombre}</span>
                  <span className="mt-1 block text-sm text-[#B7AB9C] tabular-nums">{total > 0 ? `${total} ${ui === "en" ? (total === 1 ? "episode" : "episodes") : (total === 1 ? "episodio" : "episodios")}` : (ui === "en" ? "Coming soon" : "Próximamente")}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
      <h1 className="font-display text-5xl">{copy.catalogTitle}</h1>
      <p className="mt-4 max-w-xl text-lg text-[#B7AB9C]">{ui === "en" ? "Every book, in order. Open one to see its episodes." : "Cada libro, en orden. Ábrelo para ver sus episodios."}</p>
      <FiltroCatalogo
        etiqueta={ui === "en" ? "Testament" : "Testamento"}
        todos={ui === "en" ? "All" : "Todos"}
        antiguo={ui === "en" ? "Old Testament" : "Antiguo Testamento"}
        nuevo={ui === "en" ? "New Testament" : "Nuevo Testamento"}
        buscar={ui === "en" ? "Find a book" : "Buscar un libro"}
      >
        {bloque(ui === "en" ? "Old Testament" : "Antiguo Testamento", "at", grupos.at)}
        {bloque(ui === "en" ? "New Testament" : "Nuevo Testamento", "nt", grupos.nt)}
      </FiltroCatalogo>
    </main>
  );
}

export function SitioMembresia({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  const obra = obraDeEpisodio("gn-05");
  if (!copy || !obra) return null;
  const ui = idiomaUi(lang);
  return (
    <>
      <main className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-16">
        <div>
          <PaywallWeb lang={lang} />
        </div>
        <div className="relative min-h-80 overflow-hidden bg-[#0C0B09]">
          <ObraFoto obra={obra} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <Placa obra={obra} lang={ui} />
          </div>
        </div>
      </main>
    </>
  );
}
