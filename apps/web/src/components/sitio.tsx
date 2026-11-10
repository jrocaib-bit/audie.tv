import { loadAppCatalog } from "@audite/content/app-catalog";
import { obraDeEpisodio, obrasVisibles, rotuloObra } from "@audite/content/obras";
import { PRECIO, creditoVisible, nombreEpisodio, textoOPendiente, textosAlta } from "@audite/domain";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { ListaPorLibros } from "@/components/lista-libros";
import { ObraFoto, Placa } from "@/components/placa";
import { portadaDeReto } from "@audite/content/obras-creditos";
import { BarraFija, Ctas } from "@/components/conversion";
import { RecordarIdioma, SelectorIdioma } from "@/components/selector-idioma";
import { copiaSitio, type SitioCopy } from "@/sitio/i18n";

function idiomaUi(lang: string): "es" | "en" {
  return lang === "en" ? "en" : "es";
}

export function SitioHeader({ lang, copy, sobreObra = false }: { lang: string; copy: SitioCopy; sobreObra?: boolean }) {
  const ui = idiomaUi(lang);
  return (
    <header className={sobreObra ? "absolute inset-x-0 top-0 z-20" : "border-b border-border"}>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link href={`/${lang}`} className="inline-flex min-h-11 items-center">
          <Wordmark locale={ui} tono={sobreObra ? "blanco" : "auto"} className="h-8 w-auto md:h-9" />
        </Link>
        <nav className={`flex items-center gap-4 text-sm ${sobreObra ? "text-[#F4ECE2]" : ""}`}>
          <Link href={`/${lang}`} className="hidden min-h-11 items-center md:inline-flex">
            {copy.navHome}
          </Link>
          <Link href={`/${lang}/catalogo`} className="hidden min-h-11 items-center md:inline-flex">
            {copy.navCatalog}
          </Link>
          <Link href={`/${lang}/membresia`} className="hidden min-h-11 items-center lg:inline-flex">
            {copy.navMembership}
          </Link>
          <Link href={`/${lang}/entrar`} className="inline-flex min-h-11 items-center">
            {copy.ctaSign}
          </Link>
          <SelectorIdioma lang={lang} claro={sobreObra} />
        </nav>
      </div>
    </header>
  );
}

function Lamina({ obra, titulo, linea, href, accion }: { obra: ReturnType<typeof obrasVisibles>[number]; titulo: string; linea: string; href: string; accion: string }) {
  return (
    <section className="relative min-h-[92svh] bg-[#0C0B09] text-[#F4ECE2]">
      <div className="absolute inset-0">
        <ObraFoto obra={obra} className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/20 to-[#100E0C]/15" />
      <div className="relative z-10 mx-auto flex min-h-[92svh] w-full max-w-6xl flex-col justify-end px-5 pb-14 md:px-8">
        <h2 className="font-display max-w-3xl text-5xl leading-[0.95] md:text-7xl">{titulo}</h2>
        <p className="mt-4 max-w-md text-lg text-[#F4ECE2]">{linea}</p>
        <Link href={href} className="mt-8 inline-flex min-h-12 w-fit items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{accion}</Link>
      </div>
    </section>
  );
}

export function SitioHome({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  const ui = idiomaUi(lang);
  const legal = textosAlta(lang);
  const fuente = loadAppCatalog().fuenteTexto[ui];
  const portada = obraDeEpisodio("gn-01");
  const obras = obrasVisibles();
  const segunda = obras[1];
  const tercera = obras[2];
  const adviento = portadaDeReto("adviento-isaias");
  if (!copy || !portada) return null;
  const credito = creditoVisible(fuente, "", "");
  return (
    <>
      <RecordarIdioma />
      <SitioHeader lang={lang} copy={copy} sobreObra />
      <main className="pb-28 md:pb-0">
        <section id="hero" className="relative min-h-[100svh] bg-[#0C0B09] text-[#F4ECE2]">
          <div className="absolute inset-0 overflow-hidden">
            <ObraFoto obra={portada} priority mover className="h-full w-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/35 to-[#100E0C]/20" />
          <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-5 pt-32 pb-12 md:px-8 md:pb-16">
            <h1 className="font-display max-w-4xl text-5xl leading-[0.92] text-[#F4ECE2] md:text-8xl">{copy.homeTitle}</h1>
            <p className="mt-5 max-w-md text-lg text-[#F4ECE2]">{copy.homeLede}</p>
            <Ctas lang={lang} copy={copy} invertido precio />
          </div>
        </section>
        {segunda ? <Lamina obra={segunda} titulo={copy.dailyTitle} linea={copy.dailyBody} href="/escuchar" accion={copy.homeCta} /> : null}
        {tercera ? <Lamina obra={tercera} titulo={copy.pathTitle} linea={copy.pathBody} href={`/${lang}/catalogo`} accion={copy.navCatalog} /> : null}
        <section className="bg-[#F3ECDF] px-5 py-24 text-[#161310] md:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <p className="kicker text-[#8A6432]">{copy.ctaDays}</p>
            <p className="font-display mt-4 text-6xl leading-none md:text-8xl">{PRECIO.mes}</p>
            <p className="font-display mt-3 text-3xl text-[#5E564C] md:text-5xl">{PRECIO.anio}</p>
            <Ctas lang={lang} copy={copy} />
          </div>
        </section>
        {adviento ? (
          <section className="relative min-h-[92svh] bg-[#0C0B09] text-[#F4ECE2]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={adviento.src.ancho} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/25 to-transparent" />
            <div className="relative z-10 mx-auto flex min-h-[92svh] w-full max-w-6xl flex-col justify-end px-5 pb-14 md:px-8">
              <h2 className="font-display text-5xl md:text-7xl">{copy.adventTitle}</h2>
              <Link href="/reto/adviento-isaias" className="mt-8 inline-flex min-h-12 w-fit items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{copy.ctaAdvent}</Link>
            </div>
          </section>
        ) : null}
      </main>
      <footer className="bg-[#100E0C] px-5 py-10 text-sm text-[#B7AB9C] md:px-8">
        <div className="mx-auto w-full max-w-6xl">
          {credito ? <p>{credito}</p> : null}
          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <Link href={`/${lang}/creditos`} className="inline-flex min-h-11 items-center">{ui === "en" ? "Credits" : "Créditos"}</Link>
            <Link href={`/${lang}/condiciones`} className="inline-flex min-h-11 items-center">{legal.condiciones}</Link>
            <Link href={`/${lang}/privacidad`} className="inline-flex min-h-11 items-center">{legal.privacidad}</Link>
          </p>
        </div>
      </footer>
      <BarraFija lang={lang} copy={copy} />
    </>
  );
}

export function SitioCatalogo({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  const catalogo = loadAppCatalog();
  if (!copy) return null;
  const ui = idiomaUi(lang);
  const obras = obrasVisibles();
  return (
    <>
      <SitioHeader lang={lang} copy={copy} />
      <main className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <p className="kicker">{copy.navCatalog}</p>
        <h1 className="font-display mt-3 text-5xl md:text-6xl">{copy.catalogTitle}</h1>
        <p className="mt-4 text-lg">{copy.catalogIntro}</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {obras.map((obra) => {
            const episodio = catalogo.pendientes.find((item) => item.id === obra.episodio);
            const titulo = episodio ? nombreEpisodio(episodio, ui) : obra.escena[ui];
            const estado = episodio?.propuesta ? copy.proposed : episodio?.presentacion === "revision" ? copy.review : copy.pending;
            return (
              <li key={obra.id}>
                <Link href={`/${lang}/catalogo/${obra.episodio}`} className="group block min-h-11 overflow-hidden bg-[#0C0B09] text-[#F4ECE2]">
                  <span className="relative block aspect-[4/5] overflow-hidden">
                    <ObraFoto obra={obra} className="h-full w-full object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/10 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-4">
                      <span className="kicker text-[#C9A96E]">{rotuloObra(obra, ui)}</span>
                      <span className="mt-2 block font-serif text-3xl leading-tight">{textoOPendiente(titulo, copy.pending)}</span>
                      <span className="mt-2 block text-sm text-[#B7AB9C]">{estado}</span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-16">
          <ListaPorLibros catalog={catalogo} locale={ui} />
        </div>
      </main>
    </>
  );
}

export function SitioMembresia({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  const obra = obraDeEpisodio("gn-05");
  if (!copy || !obra) return null;
  const ui = idiomaUi(lang);
  return (
    <>
      <SitioHeader lang={lang} copy={copy} />
      <main className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-16">
        <div>
          <p className="kicker">{copy.navMembership}</p>
          <h1 className="font-display mt-3 text-5xl md:text-6xl">{copy.membershipTitle}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed">{copy.ctaDays}</p>
          <p className="font-display mt-3 text-4xl">{PRECIO.mes}</p>
          <p className="mt-1 text-muted">{PRECIO.anio}</p>
          <Link href="/escuchar" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-primary px-6 text-primary-foreground">
            {copy.appLink}
          </Link>
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
