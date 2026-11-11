import { loadAppCatalog } from "@audite/content/app-catalog";
import { obraDeEpisodio } from "@audite/content/obras";
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

export function SitioHome({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  const ui = idiomaUi(lang);
  const portada = obraDeEpisodio("gn-01");
  const entrar = etiquetaEntrar(process.env.GOOGLE_LOGIN_ENABLED === "true", copy?.ctaSign ?? "Entrar", copy?.ctaGhost ?? "Entrar");
  if (!copy || !portada) return null;
  const titulo = ui === "en" ? "The Bible, from beginning to end." : "La Biblia, de principio a fin.";
  const lede = ui === "en"
    ? "The whole Bible in audio, episode by episode, with the art in front."
    : "La Biblia entera en audio, episodio a episodio, con el arte delante.";
  const como = ui === "en"
    ? "Start with a book, or with the Advent challenge. Listening continues in the app."
    : "Empieza por un libro, o por el reto de Adviento. La escucha sigue en la app.";
  const escenas = ["ex-01", "is-01", "mt-01", "lc-01", "ap-01"].flatMap((id) => {
    const obra = obraDeEpisodio(id);
    return obra ? [obra] : [];
  });
  return (
    <>
      <RecordarIdioma />
      <main className="bg-[#100E0C] text-[#F4ECE2]">
        <section id="hero" className="relative min-h-[100svh] snap-start bg-[#100E0C]">
          <div className="absolute inset-0 overflow-hidden">
            <ObraFoto obra={portada} priority className="parallax-obra h-full w-full object-cover" />
          </div>
          <div className="velo-luz absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(201_169_110/0.22),transparent_46%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/50 to-[#100E0C]/15" />
          <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-5 pt-28 pb-12 md:px-8">
            <h1 className="font-display max-w-4xl text-[clamp(2.6rem,8vw,6rem)] leading-[0.95]">{palabras(titulo).map((palabra, indice) => <span key={`${palabra}-${indice}`} className="palabra" style={{ animationDelay: `${indice * 70}ms` }}>{palabra}</span>)}</h1>
            <p className="mt-5 max-w-xl text-lg">{lede}</p>
            <p className="mt-3 max-w-xl text-[#E7D7C3]">{como}</p>
            <p className="mt-4 text-sm text-[#C9A96E]">La voz y la música están generadas con IA.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${lang}/catalogo`} className="boton inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{copy.navCatalog}</Link>
              <Link href={`/${lang}/retos`} className="boton inline-flex min-h-12 items-center rounded-full border border-[#F4ECE2]/30 px-6">{ui === "en" ? "Challenges" : "Retos"}</Link>
              <Link href={`/${lang}/entrar`} className="boton inline-flex min-h-12 items-center rounded-full border border-[#F4ECE2]/30 px-6">{entrar}</Link>
            </div>
          </div>
        </section>
        {escenas.map((obra) => (
          <section key={obra.id} className="relative min-h-[100svh] snap-start overflow-hidden">
            <ObraFoto obra={obra} className="parallax-obra absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/30 to-transparent" />
            <div className="relative z-10 flex min-h-[100svh] items-end px-5 pb-16 md:px-8">
              <h2 className="font-display max-w-3xl text-[clamp(2.4rem,7vw,5rem)] leading-[0.95]">{obra.titulo[ui]}</h2>
            </div>
          </section>
        ))}
      </main>
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
