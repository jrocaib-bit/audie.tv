import { loadAppCatalog } from "@audite/content/app-catalog";
import { audioListo } from "@audite/content/audio-listo";
import { esPortadaProvisional, obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { precioLanzamientoActivo, textosAlta } from "@audite/domain";
import type { ReactNode } from "react";
import Link from "next/link";
import { lineaCee } from "@/lib/mencion-cee";
import { Wordmark } from "@/components/brand";
import { BucleCuadro } from "@/components/bucle-cuadro";
import { ObraFoto, Placa } from "@/components/placa";
import { bucleDeHero } from "@/lib/bucles";
import { EnlaceNav } from "@/components/enlace-nav";
import { RecordarIdioma, SelectorIdioma } from "@/components/selector-idioma";
import { agruparLibros } from "@/lib/publico";
import { palabras } from "@/lib/movimiento";
import { BarraPersistente, CompactarCabecera, FiltroCatalogo } from "@/components/movimiento";
import { BotonProbar, ProbarAudio } from "@/components/probar";
import { etiquetaInicio } from "@/lib/publico";
import { episodioDeCita, idsDePrueba, inicioDeTemporada, retosDeTemporada } from "@/lib/retos-anio";
import { estadoDeReto, hoyMadrid, portadasSinRepetir } from "@/lib/sala";
import { BotonOro, botonOroVariantes } from "@/components/sala/boton-oro";
import { Lienzo, LienzoCard } from "@/components/sala/lienzo";
import { PlanCard } from "@/components/sala/plan-card";
import { Rail } from "@/components/sala/rail";
import { RetoCartel } from "@/components/sala/reto-cartel";
import { tiendasVisibles } from "@/lib/tiendas-app";
import { PaywallWeb } from "@/components/paywall-web";
import { EnlaceCuenta } from "@/components/enlace-cuenta";
import { EnlaceSoporte } from "@/components/enlace-soporte";
import { FormularioBoletin } from "@/components/formularios";
import { marcaFormulario } from "@/lib/formularios/acciones";
import { copiaSitio, type SitioCopy } from "@/sitio/i18n";
import { hayIndiceLibros, RUTA_LIBROS } from "@/lib/hay-libros";
import { NavSitio, type EnlaceNav } from "@/components/sitio-nav";

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

function enlacesPrincipales(lang: string, copy: SitioCopy): EnlaceNav[] {
  const ui = idiomaUi(lang);
  const items: EnlaceNav[] = [
    { href: `/${lang}`, etiqueta: copy.navHome },
    { href: `/${lang}/catalogo`, etiqueta: copy.navCatalog },
    { href: `/${lang}/sala`, etiqueta: copy.navSala },
  ];
  if (hayIndiceLibros()) items.push({ href: `/${lang}${RUTA_LIBROS}`, etiqueta: copy.navBooks });
  items.push({ href: `/${lang}/retos`, etiqueta: ui === "en" ? "Challenges" : "Retos" });
  return items;
}

export function SitioHeader({ lang, copy, sobreObra = false }: { lang: string; copy: SitioCopy; sobreObra?: boolean }) {
  const ui = idiomaUi(lang);
  return (
    <header data-cabecera="" className={sobreObra ? "cabecera cabecera-obra relative inset-x-0 top-0 z-20" : "cabecera relative"}>
      <CompactarCabecera />
      <div className="cabecera-interior mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link href={`/${lang}`} className="inline-flex min-h-11 items-center">
          <Wordmark locale={ui} tono="blanco" className="h-8 w-auto md:h-9" />
        </Link>
        <NavSitio enlaces={enlacesPrincipales(lang, copy)} menu={copy.navMenu} cerrar={copy.navClose}>
          <Link href={`/${lang}/app`} className="hidden min-h-11 items-center md:inline-flex">
            App
          </Link>
          <EnlaceCuenta href={`/${lang}/entrar`} className="inline-flex min-h-11 items-center" cuenta={ui === "en" ? "Account" : "Cuenta"}>
            {etiquetaEntrar(process.env.GOOGLE_LOGIN_ENABLED === "true", copy.ctaSign, copy.ctaGhost)}
          </EnlaceCuenta>
          <SelectorIdioma lang={lang} claro={sobreObra} />
        </NavSitio>
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
  const enlace = "inline-flex min-h-11 items-center text-[#B7AB9C] hover:text-[#F4ECE2]";
  const titulo = "t-rotulo text-[#B7AB9C]";
  return (
    <footer className="bg-[#0C0B09] text-[#F4ECE2]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 md:grid-cols-4 md:px-8">
        <div>
          <p className={titulo}>{ui === "en" ? "Language" : "Idioma"}</p>
          <SelectorIdioma lang={lang} claro />
        </div>
        <div className="grid content-start gap-1">
          <p className={titulo}>App</p>
          <Link href={`/${lang}`} className={enlace}>{copy.navHome}</Link>
          <Link href={`/${lang}/catalogo`} className={enlace}>{copy.navCatalog}</Link>
          <Link href={`/${lang}/sala`} className={enlace}>{copy.navSala}</Link>
          {hayIndiceLibros() ? <Link href={`/${lang}${RUTA_LIBROS}`} className={enlace}>{copy.navBooks}</Link> : null}
          <Link href={`/${lang}/retos`} className={enlace}>{ui === "en" ? "Challenges" : "Retos"}</Link>
          <Link href={`/${lang}/app`} className={enlace}>App</Link>
        </div>
        <div className="grid content-start gap-1">
          <p className={titulo}>{ui === "en" ? "Help" : "Ayuda"}</p>
          <Link href={`/${lang}/ayuda`} className={enlace}>{ui === "en" ? "Help" : "Ayuda"}</Link>
          <Link href={`/${lang}/contacto`} className={enlace}>{ui === "en" ? "Contact" : "Contacto"}</Link>
          <Link href={`/${lang}/creditos`} className={enlace}>{ui === "en" ? "Credits" : "Créditos"}</Link>
          <EnlaceSoporte idioma={lang} className={enlace}>soporte@audite.tv</EnlaceSoporte>
          <Link href={`/${lang}/membresia`} className={enlace}>{copy.navMembership}</Link>
        </div>
        <div className="grid content-start gap-1">
          <p className={titulo}>Legal</p>
          <Link href={`/${lang}/condiciones`} className={enlace}>{legal.condiciones}</Link>
          <Link href={`/${lang}/privacidad`} className={enlace}>{legal.privacidad}</Link>
          <Link href={`/${lang}/aviso-legal`} className={enlace}>{ui === "en" ? "Legal notice" : "Aviso legal"}</Link>
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <p className="t-meta">{ui === "en" ? "The voice and the music are AI-generated." : "La voz y la música están generadas con IA."}</p>
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

export function SitioHome({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  const ui = idiomaUi(lang);
  const portada = obraDeEpisodio("gn-01");
  const bucleHero = bucleDeHero("gn-01");
  const posterHero = bucleHero ? bucleHero.poster || (portada ? obraWebp(portada) : "") : "";
  const hayHeroExterno = [
    process.env.NEXT_PUBLIC_BUCLE_HERO_MP4,
    process.env.NEXT_PUBLIC_BUCLE_HERO_WEBM,
    process.env.NEXT_PUBLIC_BUCLE_HERO_POSTER,
    process.env.NEXT_PUBLIC_BUCLE_HERO_MP4_1280,
    process.env.NEXT_PUBLIC_BUCLE_HERO_WEBM_1280,
    process.env.NEXT_PUBLIC_BUCLE_HERO_POSTER_1280,
  ].some((valor) => valor?.trim());
  const altHero = bucleHero ? (hayHeroExterno ? (process.env.NEXT_PUBLIC_BUCLE_HERO_ALT?.trim() ?? "") : (bucleHero.alt || (portada ? portada.titulo[ui] : ""))) : "";
  const catalogo = loadAppCatalog();
  if (!copy || !portada) return null;
  const listos = audioListo().episodios;
  const idsListos = new Set(listos.map((episodio) => episodio.id));
  const citas = new Map<string, string>();
  for (const dia of retosDeTemporada().find((reto) => reto.id === "adviento-isaias")?.dias ?? []) {
    const id = episodioDeCita(dia.cita, catalogo.rangos);
    if (id && !citas.has(id)) citas.set(id, dia.cita);
  }
  // Ninguna obra se repite en la pantalla: el hero ya muestra la de gn-01.
  const usadas = new Set<string>([portada.id]);
  const prueba = idsDePrueba(catalogo.rangos, idsListos).flatMap((id) => {
    const obra = obraDeEpisodio(id);
    if (!obra || esPortadaProvisional(id) || usadas.has(obra.id)) return [];
    usadas.add(obra.id);
    const rango = catalogo.rangos.find((item) => item.id === id);
    const episodio = catalogo.episodes.find((item) => item.id === id);
    const segundos = listos.find((item) => item.id === id)?.duracion_s ?? episodio?.durationSeconds ?? 0;
    return [{
      id,
      obraId: obra.id,
      titulo: tituloDe(id, ui),
      src: obraWebp(obra),
      cita: citas.get(id) || (rango ? citaDeRango(rango.bookId, rango.rango) : ""),
      minutos: segundos > 0 ? Math.max(1, Math.round(segundos / 60)) : 0,
    }];
  });
  const genesis = { id: "gn-01", titulo: tituloDe("gn-01", ui) };
  const hoy = hoyMadrid();
  const ceeLinea = lineaCee(ui);
  const temporadas = ["adviento-isaias", "navidad-infancia", "cuaresma-40"].flatMap((id) => retosDeTemporada().filter((reto) => reto.id === id));
  const portadas = portadasSinRepetir(temporadas, catalogo.rangos, usadas);
  const tiendas = tiendasVisibles();
  const aviso = `/${lang}/app#aviso`;
  const funciones = [
    [copy.appPaths, "caminos"],
    [copy.appStreak, "racha"],
    [copy.appReminder, "aviso"],
    [copy.appDownloads, "bajar"],
    [copy.appLanguages, "idioma"],
  ] as const;
  const cifras = [
    { valor: String(catalogo.rangos.length), etiqueta: copy.statEpisodes },
    { valor: String(catalogo.books.length), etiqueta: copy.statBooks },
    { valor: "~10", etiqueta: copy.statMinutes },
  ];
  return (
    <>
      <RecordarIdioma />
      <ProbarAudio>
        <main className="bg-[#100E0C] text-[#F4ECE2]">
          <section id="hero" className="relative bg-[#0C0B09] md:min-h-[100svh]">
            {posterHero ? <link rel="preload" as="image" href={posterHero} fetchPriority="high" /> : null}
            <div className="relative h-[58svh] overflow-hidden md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[64%]">
              {bucleHero ? (
                <BucleCuadro bucle={{ ...bucleHero, poster: posterHero, alt: altHero }} priority />
              ) : (
                <Lienzo src={obraWebp(portada)} obraId={portada.id} alt={portada.titulo[ui]} priority className="absolute inset-0" />
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#100E0C] to-transparent md:inset-y-0 md:right-auto md:left-0 md:h-auto md:w-1/3 md:bg-gradient-to-r" />
            </div>
            <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-end px-5 pt-6 pb-12 md:min-h-[100svh] md:px-8 md:pt-28 md:pb-16">
              <div className="md:max-w-[38%]">
                <h1 className="font-display t-display">{copy.homeTitle.split("\n").map((linea) => <span key={linea} className="block">{palabras(linea).map((palabra, indice) => <span key={`${linea}-${palabra}-${indice}`} className="palabra" style={{ animationDelay: `${indice * 70}ms` }}>{palabra}</span>)}</span>)}</h1>
                <p className="mt-4 text-lg text-[#B7AB9C]">{copy.homeLede}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <BotonOro asChild><Link href={`/${lang}/entrar`}>{copy.ctaTrial}</Link></BotonOro>
                  <BotonProbar ficha={genesis} etiqueta={copy.heroListen} conIcono className={botonOroVariantes({ variante: "fantasma" })} />
                  <BotonOro asChild variante="fantasma"><Link href={`/${lang}/retos/adviento-isaias`}>{copy.ctaChallengeFree}</Link></BotonOro>
                </div>
                <p className="mt-3 text-sm text-[#E7D7C3]" data-nota-muestra="">{copy.sampleNote} {copy.challengeNote}</p>
                <p className="mt-1 text-sm text-[#B7AB9C]" data-nota-navegador="">{copy.browserNote}</p>
              </div>
              {!hayHeroExterno ? <div className="mt-8 md:absolute md:right-8 md:bottom-8 md:mt-0 md:max-w-xs"><Placa obra={portada} lang={ui} /></div> : null}
            </div>
          </section>
          {prueba.length > 0 ? (
            <Rail titulo={copy.todayTitle}>
              {prueba.map((episodio) => (
                <li key={episodio.id}>
                  <LienzoCard
                    src={episodio.src}
                    obraId={episodio.obraId}
                    titulo={episodio.titulo}
                    meta={[episodio.cita, episodio.minutos ? `${episodio.minutos} min` : ""].filter(Boolean).join(" · ")}
                    accion={(
                      <Link href={`/${lang}/oir/${episodio.id}`} aria-label={`${copy.playLabel}: ${episodio.titulo}`} title={copy.listenFree} className="sala-boton absolute bottom-3 left-3 z-10 inline-flex size-12 items-center justify-center rounded-full bg-[#100E0C]/85 text-[#F4ECE2] hover:bg-[#2E2924]">
                        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
                      </Link>
                    )}
                  />
                </li>
              ))}
            </Rail>
          ) : null}
          <Rail titulo={copy.seasonsTitle} cartel verTodo={{ href: `/${lang}/retos`, etiqueta: copy.seeAll }} rejilla>
            {temporadas.map((reto) => {
              const inicio = inicioDeTemporada(reto.id);
              const portadaReto = portadas.get(reto.id) ?? null;
              return (
                <li key={reto.id}>
                  <RetoCartel
                    href={`/${lang}/retos/${reto.id}`}
                    titulo={reto.titulo[ui]}
                    chip={inicio ? etiquetaInicio(inicio, ui) : ""}
                    meta={`${reto.dias.length} ${ui === "en" ? "days" : "días"}`}
                    src={portadaReto?.src ?? null}
                    obraId={portadaReto?.obraId}
                    portadaOficial={portadaReto?.oficial}
                    dias={reto.dias.length}
                    hechos={estadoDeReto(reto, hoy).hechos}
                  />
                </li>
              );
            })}
          </Rail>
          <section className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8" aria-label={cifras.map((cifra) => `${cifra.valor} ${cifra.etiqueta}`).join(" · ")}>
            <p className="flex flex-wrap items-baseline gap-x-8 gap-y-3 font-display">
              {cifras.map((cifra) => (
                <span key={cifra.etiqueta} className="inline-flex items-baseline gap-2">
                  <span className="t-cifra">{cifra.valor}</span>
                  <span className="text-xl text-[#B7AB9C]">{cifra.etiqueta}</span>
                </span>
              ))}
            </p>
            <p className="mt-4 text-sm text-[#E7D7C3]">{copy.durationNote} {copy.familyNote}</p>
            {ceeLinea ? <p className="mt-2 text-sm text-[#B7AB9C]">{ceeLinea}</p> : null}
          </section>
          <section className="mx-auto w-full max-w-xl px-5 py-12 md:px-8">
            <p className="t-rotulo text-[#C9A96E]">{copy.priceFree}</p>
            <h2 className="font-display t-h1 mt-2">Audite Premium</h2>
            <PlanCard ui={ui} className="mt-6">
              <BotonOro asChild className="w-full"><Link href={`/${lang}/entrar`}>{copy.homeCta}</Link></BotonOro>
            </PlanCard>
          </section>
          <section className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
            <h2 className="font-display t-h2">{copy.appTitle}</h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {funciones.map(([titulo, icono]) => (
                <li key={titulo} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#2E2924] px-4 text-sm text-[#F4ECE2]">
                  <IconoLinea tipo={icono} />
                  {titulo}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <BadgeTienda href={tiendas?.apple ?? aviso} linea={copy.badgeGet} marca="App Store" pronto={tiendas ? "" : copy.storeSoon} tipo="tienda" />
              <BadgeTienda href={tiendas?.google ?? aviso} linea={copy.badgeGet} marca="Google Play" pronto={tiendas ? "" : copy.storeSoon} tipo="play" />
            </div>
            <p className="mt-3 max-w-xl text-sm text-[#B7AB9C]">{copy.browserNote}</p>
          </section>
        </main>
      </ProbarAudio>
    </>
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
                  {obra && !esPortadaProvisional(obra.episodio) ? <ObraFoto obra={obra} /> : (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#1B1815]" data-monograma="">
                      <span className="font-display text-5xl text-[#C9A96E]" aria-hidden="true">{nombre.replace(/^\d+\s*/, "").slice(0, 1)}</span>
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
  const ceeLinea = lineaCee(ui);
  return (
    <>
      <main className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-16">
        <div>
          <PaywallWeb lang={lang} lanzamiento={precioLanzamientoActivo()} />
          <div className="mx-auto mt-2 grid max-w-xl gap-2 px-5 text-sm text-[#B7AB9C]">
            <p>{copy.durationNote}</p>
            <p>{copy.familyNote}</p>
            <p>{copy.browserNote}</p>
            {ceeLinea ? <p>{ceeLinea}</p> : null}
          </div>
        </div>
        <Lienzo src={obraWebp(obra)} obraId={obra.id} alt={obra.titulo[ui]} className="min-h-80 md:min-h-[32rem]">
          <div className="absolute inset-x-0 bottom-0 z-10 p-4">
            <Placa obra={obra} lang={ui} />
          </div>
        </Lienzo>
      </main>
    </>
  );
}
