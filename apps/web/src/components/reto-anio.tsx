import Link from "next/link";
import { esPortadaProvisional, obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { BucleCuadro } from "@/components/bucle-cuadro";
import { Placa } from "@/components/placa";
import { BotonOro } from "@/components/sala/boton-oro";
import { Lienzo } from "@/components/sala/lienzo";
import { HuecoAdvientoO1 } from "@/components/hueco-adviento-o1";
import { bucleDeEpisodio, bucleDeReto } from "@/lib/bucles";
import { Mark } from "@/components/brand";
import { etiquetaInicio, fechaLegible } from "@/lib/publico";
import { estadoDeReto, hoyMadrid } from "@/lib/sala";
import { copiaSitio } from "@/sitio/i18n";
import { portadaDeReto } from "@audite/content/obras-creditos";
import { CREDITOS_DIAS_PROFECIAS, CREDITO_PORTADA_PROFECIAS, episodioDeCita, fechaDeDia, inicioDeTemporada, miniaturaDePieza, portadaConectada, portadasDeTemporada, textoDePar, type DiaAnio, type RangoEpisodio, type RetoAnioDato } from "@/lib/retos-anio";

function reloj(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${minutos}:${String(resto).padStart(2, "0")}`;
}

function paresDeCitas(dia: DiaAnio): string[] {
  if (dia.profecias && dia.profecias.length > 0) {
    return dia.profecias.map((par) => textoDePar(par));
  }
  if (dia.profecia) return [textoDePar({ profecia: dia.profecia, cumplimiento: dia.cumplimiento })];
  return dia.cita ? [dia.cita] : [];
}

function diaPieza(lang: string, ui: "es" | "en", dia: DiaAnio, numero: number, fecha: string | null, rangos: readonly RangoEpisodio[]) {
  const pronto = ui === "en" ? "Coming soon" : "Próximamente";
  const duracion = dia.duracion_s ? reloj(dia.duracion_s) : "";
  const pares = paresDeCitas(dia);
  const meta = [fecha ? fechaLegible(fecha, ui) : null, dia.diaLiturgico?.[ui]].filter(Boolean).join(" · ");
  return (
    <>
      <span className="font-display text-xl leading-tight">{numero}. {dia[ui]}</span>
      {meta ? <span className="t-meta mt-1 block">{meta}</span> : null}
      {pares.length > 0 ? (
        <span className="mt-1 block text-sm text-[#B7AB9C]">
          {pares.map((par) => <span key={par} className="block">{par}</span>)}
        </span>
      ) : null}
      {dia.descripcion ?? dia.nota ? <span className="mt-1 block text-sm text-[#E7D7C3]">{(dia.descripcion ?? dia.nota)?.[ui]}</span> : null}
      {dia.relacionados && dia.relacionados.length > 0 ? (
        <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {dia.relacionados.map((id) => {
            const rango = rangos.find((item) => item.id === id);
            const etiqueta = rango ? `${id} · ${rango.rango}` : id;
            return rango ? (
              <Link key={id} href={`/${lang}/catalogo/${id}`} className="text-sm text-[#C9A96E] underline">{etiqueta}</Link>
            ) : (
              <span key={id} className="text-sm text-[#8A8175]">{etiqueta}</span>
            );
          })}
        </span>
      ) : null}
      <span className="mt-1 block text-sm text-[#8A8175]">{duracion ? `${duracion} · ${pronto}` : pronto}</span>
    </>
  );
}

function IconoEscuchar() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </svg>
  );
}

/** Un día como relato: imagen y botón arriba, 2 a 4 párrafos, y al final las lecturas como complemento. */
function diaNarrado(lang: string, ui: "es" | "en", dia: DiaAnio, numero: number, fecha: string | null, rangos: readonly RangoEpisodio[], mini: string, creditoDia: string | undefined) {
  const pronto = ui === "en" ? "Coming soon" : "Próximamente";
  const duracion = dia.duracion_s ? reloj(dia.duracion_s) : "";
  const pares = paresDeCitas(dia);
  const meta = [fecha ? fechaLegible(fecha, ui) : null, dia.diaLiturgico?.[ui]].filter(Boolean).join(" · ");
  const parrafos = dia.narracion?.[ui] ?? [];
  const etiquetaLecturas = ui === "en" ? "Readings of the day" : "Lecturas del día";
  const etiquetaEpisodios = ui === "en" ? "Full episodes" : "Episodios completos";
  const etiquetaObra = ui === "en" ? "Artwork" : "Obra";
  const etiquetaEscuchar = ui === "en" ? "Listen" : "Escuchar";
  const columnas = mini ? "md:grid md:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] md:gap-x-8" : "";
  const derecha = mini ? "md:col-start-2" : "";
  return (
    <article data-narrado="" className={columnas}>
      {mini ? (
        <span data-obra={`${dia.pieza}-miniatura`} className="block aspect-video overflow-hidden rounded-xl bg-[#0C0B09] md:col-start-1 md:row-span-4 md:row-start-1 md:self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mini} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
        </span>
      ) : null}
      <header className={`mt-4 ${mini ? "md:mt-0" : ""} ${derecha}`}>
        <h2 className="font-display text-2xl leading-tight md:text-3xl">{numero}. {dia[ui]}</h2>
        {meta ? <p className="t-meta mt-1">{meta}</p> : null}
      </header>
      <div className={`mt-4 ${derecha}`}>
        <BotonOro variante="secundario" disabled aria-disabled="true" className="w-full md:w-auto" data-escuchar="">
          <IconoEscuchar />
          <span>{[etiquetaEscuchar, duracion, pronto].filter(Boolean).join(" · ")}</span>
        </BotonOro>
      </div>
      <div data-relato="" lang={ui} className={`mt-5 max-w-[62ch] space-y-4 text-[1.0625rem] leading-[1.65] text-[#E7D7C3] ${derecha}`}>
        {parrafos.map((texto, i) => <p key={i}>{texto}</p>)}
      </div>
      <details data-lecturas="" className={`group mt-6 rounded-xl border border-[#2E2924] bg-[#1B1815]/70 ${derecha}`}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 text-sm text-[#B7AB9C] marker:hidden [&::-webkit-details-marker]:hidden">
          <span>{etiquetaLecturas}</span>
          <svg viewBox="0 0 24 24" className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.75" /></svg>
        </summary>
        <div className="space-y-4 px-4 pb-4 text-sm">
          {pares.length > 0 ? (
            <ul className="space-y-1 text-[#B7AB9C]">
              {pares.map((par) => <li key={par}>{par}</li>)}
            </ul>
          ) : null}
          {dia.nota ? <p className="text-[#8A8175]">{dia.nota[ui]}</p> : null}
          {dia.relacionados && dia.relacionados.length > 0 ? (
            <div>
              <p className="t-rotulo text-[#8A8175]">{etiquetaEpisodios}</p>
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                {dia.relacionados.map((id) => {
                  const rango = rangos.find((item) => item.id === id);
                  const etiqueta = rango ? `${id} · ${rango.rango}` : id;
                  return rango ? (
                    <Link key={id} href={`/${lang}/catalogo/${id}`} className="inline-flex min-h-8 items-center text-[#C9A96E] underline">{etiqueta}</Link>
                  ) : (
                    <span key={id} className="text-[#8A8175]">{etiqueta}</span>
                  );
                })}
              </p>
            </div>
          ) : null}
          {creditoDia ? (
            <div>
              <p className="t-rotulo text-[#8A8175]">{etiquetaObra}</p>
              <p className="t-meta mt-1">{creditoDia}</p>
            </div>
          ) : null}
        </div>
      </details>
    </article>
  );
}

export function VistaRetoAnio({ lang, reto, rangos, hoy = hoyMadrid() }: { lang: string; reto: RetoAnioDato; rangos: readonly RangoEpisodio[]; hoy?: string }) {
  const ui = lang === "en" ? "en" : "es";
  const copy = copiaSitio(lang);
  const inicio = inicioDeTemporada(reto.id);
  const fin = reto.dias.at(-1)?.fecha || null;
  const conectada = portadaConectada(reto);
  const portada = portadasDeTemporada(rangos)[reto.id];
  const obra = portada?.tipo === "episodio" ? obraDeEpisodio(portada.episodio) : null;
  const oficialVertical = portada?.tipo === "reto" ? portadaDeReto(reto.id) : null;
  const src = conectada || (oficialVertical ? oficialVertical.src.vertical : portada?.tipo === "reto" ? portada.src : obra ? obraWebp(obra) : "");
  const oficial = Boolean(conectada) || portada?.tipo === "reto";
  const bucle = !conectada && portada?.tipo === "reto"
    ? bucleDeReto(reto.id, portada.obraId)
    : !conectada && portada?.tipo === "episodio"
      ? bucleDeEpisodio(portada.episodio)
      : null;
  const poster = bucle?.poster || (oficialVertical ? oficialVertical.src.ancho : src) || "";
  const { estado, hechos } = estadoDeReto(reto, hoy);
  const total = reto.dias.length;
  const episodios = reto.dias.map((dia) => (dia.pieza ? null : episodioDeCita(dia.cita, rangos)));
  const siguiente = episodios.findIndex((id, indice) => indice >= hechos && id);
  const destino = siguiente >= 0 ? `/${lang}/catalogo/${episodios[siguiente]}` : `/${lang}/app#aviso`;
  const etiquetaCta = estado === "en-curso" && hechos > 0 ? (ui === "en" ? "Continue" : "Continuar") : (copy?.ctaAdvent ?? "Empieza el reto");
  // Cada miniatura es una obra distinta de la portada y de las demás.
  const usadas = new Set<string>(portada?.obraId ? [portada.obraId] : []);
  const miniaturas = episodios.map((id) => {
    const delDia = id ? obraDeEpisodio(id) : null;
    if (!id || !delDia || esPortadaProvisional(id) || usadas.has(delDia.id)) return null;
    usadas.add(delDia.id);
    return { src: obraWebp(delDia), obraId: delDia.id };
  });
  const pronto = ui === "en" ? "Coming soon" : "Próximamente";
  const premium = reto.id !== "adviento-isaias";
  return (
    <main className="bg-[#100E0C] text-[#F4ECE2]">
      <div className="relative h-[56svh] overflow-hidden bg-[#0C0B09] md:h-[64svh]">
        {bucle && poster ? (
          <BucleCuadro bucle={{ ...bucle, poster, alt: bucle.alt }} priority />
        ) : src && oficial ? (
          // Portada oficial completa (contain + fondo). El recorte cover solo va en carteles 4:5 / 9:16.
          <Lienzo src={(oficialVertical?.src.ancho ?? src)} obraId={portada?.obraId} priority className="absolute inset-0" />
        ) : src ? (
          <Lienzo src={src} obraId={portada?.obraId} priority className="absolute inset-0" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1B1815]" data-hueco="marca">
            <Mark className="h-16 w-16" tono="oro" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#100E0C] to-transparent" />
      </div>
      <div className="mx-auto w-full max-w-4xl px-5 pb-16 md:px-8">
        {reto.insignia ? <p className="t-rotulo mt-6 text-[#C9A96E]" data-insignia="">{reto.insignia[ui]}</p> : null}
        {conectada ? <h1 className="sr-only">{reto.titulo[ui]}</h1> : <h1 className={`font-display t-display ${reto.insignia ? "mt-2" : "mt-6"}`}>{reto.titulo[ui]}</h1>}
        {conectada ? <p className="t-meta mt-3" data-credito-portada="">{CREDITO_PORTADA_PROFECIAS[ui]}</p> : null}
        <p className="t-rotulo mt-3 text-[#B7AB9C]">{[`${total} ${ui === "en" ? "days" : "días"}`, inicio ? etiquetaInicio(inicio, ui) : "", fin ? (ui === "en" ? `until ${fechaLegible(fin, ui)}` : `hasta el ${fechaLegible(fin, ui)}`) : ""].filter(Boolean).join(" · ")}</p>
        <div className="mt-6" data-progreso="">
          <p className="font-display t-cifra">{hechos} <span className="text-xl text-[#B7AB9C]">{ui === "en" ? "of" : "de"} {total}</span></p>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hechos} className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#2E2924]">
            <div className="h-full rounded-full bg-[#C9A96E]" style={{ width: `${total ? Math.round((hechos / total) * 100) : 0}%` }} />
          </div>
        </div>
        <BotonOro asChild className="mt-6 w-full md:w-auto"><Link href={destino}>{etiquetaCta}</Link></BotonOro>
        <p className="mt-8 text-[#E7D7C3]">{reto.explica[ui]}</p>
        {!reto.fijo ? <p className="mt-2 text-sm text-[#B7AB9C]">{ui === "en" ? "It can be walked in any stretch of Ordinary Time." : "Se puede recorrer en cualquier tramo de Tiempo ordinario."}</p> : null}
        {reto.id === "adviento-isaias" ? <HuecoAdvientoO1 lang={ui} /> : null}
        {reto.dias.some((dia) => dia.pieza) ? null : (
          <ol className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" data-calendario="">
            {reto.dias.map((dia, indice) => {
              const fecha = dia.fecha ?? fechaDeDia(reto.id, indice);
              const episodio = episodios[indice] ?? null;
              const miniatura = miniaturas[indice] ?? null;
              const estadoDia = indice < hechos ? "hecho" : estado === "en-curso" && indice === hechos ? "hoy" : !episodio ? "pronto" : premium ? "candado" : "futuro";
              const etiqueta = { hecho: ui === "en" ? "Done" : "Hecho", hoy: ui === "en" ? "Today" : "Hoy", pronto, candado: "Premium", futuro: "" }[estadoDia];
              const meta = [fecha ? fechaLegible(fecha, ui) : null, dia.cita].filter(Boolean).join(" · ");
              const cuerpo = (
                <>
                  {miniatura ? (
                    <span data-obra={miniatura.obraId} className="block aspect-[4/3] bg-[#0C0B09]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={miniatura.src} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
                    </span>
                  ) : null}
                  <span className="block p-3">
                    {etiqueta ? <span className="t-rotulo mb-1 flex items-center gap-1 text-[#B7AB9C]">{estadoDia === "candado" ? <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" fill="none" stroke="currentColor" strokeWidth="1.75" /></svg> : null}{etiqueta}</span> : null}
                    <span className="font-display block text-lg leading-tight">{indice + 1}. {dia[ui]}</span>
                    <span className="t-meta mt-1 block">{meta}</span>
                  </span>
                </>
              );
              const clase = `block overflow-hidden rounded-2xl border bg-[#1B1815] ${estadoDia === "hoy" ? "border-[#E0C48A]" : "border-[#2E2924]"} ${estadoDia === "hecho" ? "opacity-70" : ""}`;
              return (
                <li key={`${reto.id}-${indice}`} data-dia={indice + 1} data-estado={estadoDia} className="aparecer" style={{ ["--i" as string]: indice % 12 }}>
                  {episodio ? <Link href={`/${lang}/catalogo/${episodio}`} className={clase}>{cuerpo}</Link> : <div className={clase}>{cuerpo}</div>}
                </li>
              );
            })}
          </ol>
        )}
        {reto.dias.some((dia) => dia.pieza) ? (
          <ol className="mt-10 divide-y divide-[#2E2924] border-y border-[#2E2924]">
            {reto.dias.map((dia, indice) => {
              if (!dia.pieza) return null;
              const mini = miniaturaDePieza(dia.pieza);
              const creditoDia = mini ? CREDITOS_DIAS_PROFECIAS[dia.pieza]?.[ui] : undefined;
              return (
                <li key={dia.pieza} className={dia.narracion ? "py-8" : "py-3"} data-dia={indice + 1}>
                  {dia.narracion ? diaNarrado(lang, ui, dia, indice + 1, dia.fecha ?? fechaDeDia(reto.id, indice), rangos, mini, creditoDia) : null}
                  {dia.narracion ? null : <div className={mini ? "flex gap-3" : undefined}>
                    {mini ? (
                      <span data-obra={`${dia.pieza}-miniatura`} className="block h-16 w-28 shrink-0 overflow-hidden rounded-md bg-[#0C0B09]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mini} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
                      </span>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      {diaPieza(lang, ui, dia, indice + 1, dia.fecha ?? fechaDeDia(reto.id, indice), rangos)}
                      {creditoDia ? <span className="t-meta mt-1 block">{creditoDia}</span> : null}
                    </div>
                  </div>}
                </li>
              );
            })}
          </ol>
        ) : null}
        {obra && !oficial ? <div className="mt-10 max-w-sm"><Placa obra={obra} lang={ui} /></div> : null}
        <Link href={`/${lang}/retos`} className="mt-8 inline-flex min-h-11 items-center text-sm text-[#B7AB9C] underline">{ui === "en" ? "All challenges" : "Todos los retos"}</Link>
      </div>
    </main>
  );
}
