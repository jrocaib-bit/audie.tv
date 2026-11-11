import { loadAppCatalog } from "@audite/content/app-catalog";
import { audioListo } from "@audite/content/audio-listo";
import { esPortadaProvisional, obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { etiquetaDeLanzamiento, letraDeLanzamiento, precioLanzamientoActivo, textosAlta } from "@audite/domain";
import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { ObraFoto, Placa } from "@/components/placa";
import { RecordarIdioma, SelectorIdioma } from "@/components/selector-idioma";
import { agruparLibros } from "@/lib/publico";
import { palabras } from "@/lib/movimiento";
import { BarraPersistente, CompactarCabecera, FiltroCatalogo } from "@/components/movimiento";
import { Acordeon, BotonProbar, Contador, ProbarAudio, Telefono } from "@/components/probar";
import { etiquetaInicio } from "@/lib/publico";
import { episodioDeCita, idsDePrueba, inicioDeTemporada, portadasDeTemporada, retosDeTemporada } from "@/lib/retos-anio";
import { tiendasVisibles } from "@/lib/tiendas-app";
import { PaywallWeb } from "@/components/paywall-web";
import { EnlaceSoporte } from "@/components/enlace-soporte";
import { PortadaMarca } from "@/components/portada-marca";
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
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 md:grid-cols-4 md:px-8">
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
      <div className="mx-auto w-full max-w-[520px] px-5">
        {novedades ? <FormularioBoletin marca={marca} idioma={lang} /> : null}
      </div>
      <div className="wordmark-sangre" aria-hidden="true">
        <p className="font-display text-[#F4ECE2]">AUDITE</p>
      </div>
    </footer>
  );
}

const TONOS = ["#3C2A1E", "#243028", "#4A3424", "#2A241C", "#3A2C22", "#1E2A32"];

function tonoDe(id: string): string {
  let n = 0;
  for (const letra of id) n = (n * 31 + letra.charCodeAt(0)) >>> 0;
  return TONOS[n % TONOS.length] ?? "#3C2A1E";
}

function reloj(segundos: number): string {
  const total = Math.max(0, Math.round(segundos));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function citaDeRango(bookId: string, rango: string): string {
  const trozo = rango.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
  if (!trozo) return "";
  const siglas: Record<string, string> = { gn: "Gn", is: "Is", ex: "Ex", lc: "Lc", mt: "Mt", jn: "Jn", mc: "Mc", hch: "Hch" };
  return `${siglas[bookId] ?? bookId.slice(0, 2).toUpperCase()} ${trozo[1]},${trozo[2]}–${trozo[3]},${trozo[4]}`;
}

function tituloDe(id: string, ui: "es" | "en"): string {
  const catalogo = loadAppCatalog();
  const episodio = catalogo.episodes.find((item) => item.id === id) ?? catalogo.pendientes.find((item) => item.id === id);
  return episodio?.tituloCorto?.[ui] || episodio?.titulo?.[ui] || obraDeEpisodio(id)?.titulo[ui] || id;
}

function Camino() {
  return (
    <svg className="camino" viewBox="0 0 600 72" aria-hidden="true">
      <path className="camino-base" pathLength={1} d="M12 36 C 120 8, 200 64, 300 36 S 480 8, 588 36" />
      <path className="camino-trazo" pathLength={1} d="M12 36 C 120 8, 200 64, 300 36 S 480 8, 588 36" />
    </svg>
  );
}

function Ctas({ lang, copy, ficha }: { lang: string; copy: NonNullable<ReturnType<typeof copiaSitio>>; ficha: { id: string; titulo: string } }) {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
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
  const listos = audioListo().episodios;
  const idsListos = new Set(listos.map((episodio) => episodio.id));
  const citas = new Map<string, string>();
  for (const dia of retosDeTemporada().find((reto) => reto.id === "adviento-isaias")?.dias ?? []) {
    const id = episodioDeCita(dia.cita, catalogo.rangos);
    if (id && !citas.has(id)) citas.set(id, dia.cita);
  }
  const prueba = idsDePrueba(catalogo.rangos, idsListos).map((id) => {
    const obra = obraDeEpisodio(id);
    const rango = catalogo.rangos.find((item) => item.id === id);
    const episodio = catalogo.episodes.find((item) => item.id === id);
    const segundos = listos.find((item) => item.id === id)?.duracion_s ?? episodio?.durationSeconds ?? 0;
    return {
      id,
      titulo: tituloDe(id, ui),
      provisional: esPortadaProvisional(id),
      src: obra && !esPortadaProvisional(id) ? obraWebp(obra) : "",
      tono: tonoDe(id),
      cita: citas.get(id) || (rango ? citaDeRango(rango.bookId, rango.rango) : ""),
      duracion: segundos > 0 ? reloj(segundos) : "",
    };
  });
  const genesis = prueba.find((episodio) => episodio.id === "gn-01") ?? { id: "gn-01", titulo: tituloDe("gn-01", ui) };
  const adviento = retosDeTemporada().find((reto) => reto.id === "adviento-isaias");
  const inicioAdviento = adviento ? inicioDeTemporada(adviento.id) : null;
  const portadaAdviento = adviento ? portadasDeTemporada(catalogo.rangos)[adviento.id] : null;
  const srcAdviento = portadaAdviento?.tipo === "reto"
    ? portadaAdviento.src
    : portadaAdviento?.tipo === "episodio" && obraDeEpisodio(portadaAdviento.episodio)
      ? obraWebp(obraDeEpisodio(portadaAdviento.episodio)!)
      : obraWebp(portada);
  const tiendas = tiendasVisibles();
  const aviso = `/${lang}/app#aviso`;
  const funciones = [
    [copy.appPaths, copy.appPathsNote, "caminos"],
    [copy.appStreak, copy.appStreakNote, "racha"],
    [copy.appReminder, copy.appReminderNote, "aviso"],
    [copy.appDownloads, copy.appDownloadsNote, "bajar"],
    [copy.appLanguages, copy.appLanguagesNote, "idioma"],
  ] as const;
  const incluidos = [copy.priceInc1, copy.priceInc2, copy.priceInc3];
  const preguntas = [
    [copy.faqWhatQ, copy.faqWhatA],
    [copy.faqPriceQ, copy.faqPriceA],
    [copy.faqTrialQ, copy.faqTrialA],
    [copy.faqCancelQ, copy.faqCancelA],
    [copy.faqLangQ, copy.faqLangA],
  ] as const;
  const cifras = [
    { valor: catalogo.rangos.length, prefijo: "", etiqueta: copy.statEpisodes },
    { valor: catalogo.books.length, prefijo: "", etiqueta: copy.statBooks },
    { valor: 10, prefijo: "~", etiqueta: copy.statMinutes },
    { valor: retosDeTemporada().length + 1, prefijo: "", etiqueta: copy.statYear },
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
            <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-5 pt-28 pb-12 md:px-8">
              <h1 className="font-display max-w-4xl text-[clamp(2.6rem,8vw,6rem)] leading-[0.95]">{copy.homeTitle.split("\n").map((linea) => <span key={linea} className="block">{palabras(linea).map((palabra, indice) => <span key={`${linea}-${palabra}-${indice}`} className="palabra" style={{ animationDelay: `${indice * 70}ms` }}>{palabra}</span>)}</span>)}</h1>
              <p className="mt-5 max-w-xl text-lg">{copy.homeWhat}</p>
              <Ctas lang={lang} copy={copy} ficha={genesis} />
            </div>
          </section>
          <section className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
            <h2 className="font-display text-4xl">{copy.howTitle}</h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-3">
              <li>
                <div className="paso paso-elige" aria-hidden="true"><span /><span /><span /></div>
                <p className="mt-3 font-display text-2xl leading-tight">{copy.stepChoose}</p>
              </li>
              <li>
                <div className="paso paso-escucha" aria-hidden="true">
                  <span className="text-center">
                    <span className="block font-display text-4xl text-[#C9A96E]">10:00</span>
                    <span className="paso-onda onda mt-2 justify-center"><i /><i /><i /><i /></span>
                  </span>
                </div>
                <p className="mt-3 font-display text-2xl leading-tight">{copy.stepListen}</p>
              </li>
              <li>
                <div className="paso paso-fin" aria-hidden="true"><Camino /></div>
                <p className="mt-3 font-display text-2xl leading-tight">{copy.stepFinish}</p>
              </li>
            </ol>
          </section>
          <section className="mx-auto grid w-full max-w-6xl gap-3 px-5 py-8 sm:grid-cols-2 lg:grid-cols-4 md:px-8">
            {cifras.map((cifra, indice) => (
              <article key={cifra.etiqueta} className="aparecer rounded-3xl border border-[#2E2924] px-5 py-5" style={{ ["--i" as string]: indice }}>
                <p className="font-display text-5xl leading-none text-[#C9A96E]"><Contador valor={cifra.valor} prefijo={cifra.prefijo} /></p>
                <p className="mt-2 text-[#E7D7C3]">{cifra.etiqueta}</p>
              </article>
            ))}
            <p className="text-sm text-[#B7AB9C] sm:col-span-2 lg:col-span-4">{copy.voiceAi}</p>
          </section>
          <section className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
            <h2 className="font-display text-4xl">{copy.tryTitle}</h2>
            <ul className="carrusel mt-5">
              {prueba.map((episodio, indice) => (
                <li key={episodio.id} className="overflow-hidden rounded-3xl bg-[#1B1815]">
                  <span className="relative block aspect-[4/5] overflow-hidden" style={{ background: episodio.tono }}>
                    {episodio.provisional ? (
                      <PortadaMarca episodioId={episodio.id} lang={ui} className="absolute inset-0" />
                    ) : episodio.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={episodio.src} alt="" width={960} height={1200} loading={indice < 4 ? "eager" : "lazy"} fetchPriority="low" decoding="async" className="absolute inset-0 h-full w-full object-cover object-[center_28%]" />
                    ) : null}
                    <BotonProbar ficha={episodio} etiqueta={copy.listenFree} icono className="boton boton-obra absolute bottom-3 left-3 z-10 inline-flex size-12 items-center justify-center rounded-full bg-[#C9A96E] text-[#100E0C]" />
                  </span>
                  <span className="block px-4 py-3">
                    <span className="block font-display text-xl leading-tight">{episodio.titulo}</span>
                    <span className="mt-1 flex gap-3 text-sm text-[#C9A96E]">
                      {episodio.cita ? <span>{episodio.cita}</span> : null}
                      {episodio.duracion ? <span>{episodio.duracion}</span> : null}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-8 md:grid-cols-2 md:px-8">
            <article className="relative min-h-80 overflow-hidden rounded-3xl bg-[#1B1815]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={obraWebp(portada)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/55 to-[#100E0C]/10" />
              <div className="relative flex min-h-80 flex-col justify-end p-6">
                <h2 className="font-display text-4xl leading-tight">{copy.mainChallenge}</h2>
                <Camino />
                <p className="text-sm text-[#C9A96E]">{catalogo.rangos.length} {copy.statEpisodes}</p>
                <Link href={`/${lang}/retos`} className="boton mt-4 inline-flex min-h-12 w-fit items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{copy.ctaAdvent}</Link>
              </div>
            </article>
            {adviento ? (
              <article className="relative min-h-80 overflow-hidden rounded-3xl bg-[#1B1815]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={srcAdviento} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/55 to-[#100E0C]/10" />
                <div className="relative flex min-h-80 flex-col justify-end p-6">
                  <h2 className="font-display text-4xl leading-tight">{adviento.titulo[ui]}</h2>
                  {inicioAdviento ? <p className="text-sm text-[#C9A96E]">{etiquetaInicio(inicioAdviento, ui)}</p> : null}
                  <Camino />
                  <Link href={`/${lang}/retos/${adviento.id}`} className="boton mt-4 inline-flex min-h-12 w-fit items-center rounded-full border border-[#C9A96E] px-6 text-[#C9A96E]">{copy.ctaAdvent}</Link>
                </div>
              </article>
            ) : null}
          </section>
          <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 py-10 md:grid-cols-[18rem_1fr] md:px-8">
            <Telefono saludo={copy.phoneHello} dia={genesis.titulo} racha={copy.appStreak} caminos={copy.appPathsNote} obra={obraWebp(portada)} />
            <div>
              <h2 className="font-display text-4xl">{copy.appTitle}</h2>
              <ul className="mt-4">
                {funciones.map(([titulo, nota, icono]) => (
                  <li key={titulo} className="flex items-center gap-4 border-b border-[#2E2924] py-3">
                    <IconoLinea tipo={icono} />
                    <span>
                      <span className="block">{titulo}</span>
                      <span className="block text-sm text-[#B7AB9C]">{nota}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-3">
                <BadgeTienda href={tiendas?.apple ?? aviso} linea={copy.badgeGet} marca="App Store" pronto={tiendas ? "" : copy.storeSoon} tipo="tienda" />
                <BadgeTienda href={tiendas?.google ?? aviso} linea={copy.badgeGet} marca="Google Play" pronto={tiendas ? "" : copy.storeSoon} tipo="play" />
              </div>
            </div>
          </section>
          <section className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
            <p className="text-sm text-[#C9A96E]">{copy.priceFree}</p>
            <div className="mt-4 grid items-stretch gap-3 md:grid-cols-2">
              <article className="flex h-full flex-col rounded-3xl border border-[#C9A96E] px-6 py-6">
                <p className="w-fit rounded-full bg-[#C9A96E] px-3 py-1 text-sm text-[#100E0C]">{copy.priceSave}</p>
                <p className="font-display mt-3 text-5xl">{copy.priceYear}</p>
                {etiquetaDeLanzamiento(ui) ? <p className="mt-2 text-sm text-[#C9A96E]">{etiquetaDeLanzamiento(ui)}</p> : null}
                {letraDeLanzamiento(ui) ? <p className="mt-2 text-sm text-[#B7AB9C]">{letraDeLanzamiento(ui)}</p> : null}
                <ListaIncluidos items={incluidos} />
                <div className="mt-auto pt-6">
                  <Link href={`/${lang}/entrar`} className="boton inline-flex min-h-12 w-fit items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{copy.homeCta}</Link>
                </div>
              </article>
              <article className="flex h-full flex-col rounded-3xl border border-[#2E2924] px-6 py-6">
                <p className="min-h-7" />
                <p className="font-display mt-3 text-5xl">{copy.priceMonth}</p>
                <ListaIncluidos items={incluidos} />
                <div className="mt-auto pt-6">
                  <Link href={`/${lang}/entrar`} className="boton inline-flex min-h-12 w-fit items-center rounded-full border border-[#F4ECE2]/30 px-6">{copy.homeCta}</Link>
                </div>
              </article>
            </div>
            <p className="mt-3 text-sm text-[#B7AB9C]">{copy.ctaRisk}</p>
          </section>
          <section className="mx-auto w-full max-w-3xl px-5 py-8 md:px-8">
            <Acordeon items={preguntas} />
            <div className="mt-8">
              <Ctas lang={lang} copy={copy} ficha={genesis} />
            </div>
          </section>
        </main>
      </ProbarAudio>
    </>
  );
}

function ListaIncluidos({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 grid gap-2">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2 text-sm text-[#E7D7C3]">
          <svg viewBox="0 0 24 24" className="size-4 text-[#C9A96E]" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
          {item}
        </li>
      ))}
    </ul>
  );
}

function BadgeTienda({ href, linea, marca, pronto, tipo }: { href: string; linea: string; marca: string; pronto: string; tipo: "tienda" | "play" }) {
  const clase = "boton inline-flex min-h-14 items-center gap-3 rounded-xl border border-[#F4ECE2]/25 bg-[#1B1815] px-3 py-2 text-[#F4ECE2]";
  const cuerpo = (
    <>
      {tipo === "tienda" ? (
        <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2" fill="none" stroke="#C9A96E" strokeWidth="1.4" /><path d="M10.5 18.5h3" stroke="#C9A96E" strokeWidth="1.4" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="#C9A96E" strokeWidth="1.4" /><path d="M10 8.2v7.6l6.2-3.8L10 8.2z" fill="#C9A96E" /></svg>
      )}
      <span className="leading-none">
        <span className="block text-[10px] uppercase tracking-[0.14em] text-[#B7AB9C]">{linea}</span>
        <span className="mt-1 block text-base">{marca}</span>
      </span>
      {pronto ? <span className="rounded-full border border-[#C9A96E] px-2 py-1 text-[10px] text-[#C9A96E]">{pronto}</span> : null}
    </>
  );
  return href.startsWith("http") ? <a className={clase} href={href}>{cuerpo}</a> : <Link className={clase} href={href}>{cuerpo}</Link>;
}

function IconoLinea({ tipo }: { tipo: "caminos" | "racha" | "aviso" | "bajar" | "idioma" }) {
  const trazo = { fill: "none", stroke: "#C9A96E", strokeWidth: 1.4 } as const;
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden="true">
      {tipo === "caminos" ? <path {...trazo} d="M5 18c4-8 6-8 8-4s3 6 6-6" /> : null}
      {tipo === "racha" ? <path {...trazo} d="M12 20a6 6 0 0 1-3-11c1 3 3 3 3 0 3 2 5 5 5 8a5 5 0 0 1-5 3z" /> : null}
      {tipo === "aviso" ? <path {...trazo} d="M6 16h12l-1.2-2.2A6 6 0 0 1 12 4a6 6 0 0 1-4.8 9.8L6 16zm4 1.5a2 2 0 0 0 4 0" /> : null}
      {tipo === "bajar" ? <path {...trazo} d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" /> : null}
      {tipo === "idioma" ? <><circle {...trazo} cx="12" cy="12" r="8" /><path {...trazo} d="M4 12h16M12 4c2.5 2.6 2.5 13.4 0 16M12 4c-2.5 2.6-2.5 13.4 0 16" /></> : null}
    </svg>
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
          <PaywallWeb lang={lang} lanzamiento={precioLanzamientoActivo()} />
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
