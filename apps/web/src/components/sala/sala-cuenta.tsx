"use client";

import { PRECIO, textosAlta } from "@audite/domain";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { sesionWeb, tokenWeb } from "@/lib/auth-web";
import { datosVistaSala, type Adelanto, type RecorridoVista, type RespuestaSala, type VistaSala } from "@/lib/sala-cuenta";
import type { ContextoSala } from "@/lib/sala-contexto";
import { fondoMascara, geometriaMascara } from "@/lib/sala-mascara";
import { ContextoReportaje } from "./contexto-reportaje";
import { etiquetaActivo, etiquetaCamara, indiceActivo, opacidadBloque, poseDeBloque, transformaPaso, type Caja } from "@/lib/sala-scroll";

export type MockSala = "sin" | "gratis" | "premium";

const CORTE = {
  es: {
    titulo: "El recorrido sigue aquí",
    texto: `Hazte premium para seguir paso a paso por la obra, con su zoom y sus textos. ${PRECIO.anio.replace(",00", "")} al año o ${PRECIO.mes} al mes, con ${PRECIO.pruebaDias} días de prueba gratis.`,
    premium: "Prueba 7 días gratis",
    comprobando: "Comprobando tu acceso…",
  },
  en: {
    titulo: "The walk-through continues here",
    texto: `Go premium to follow the work step by step, with its zoom and texts. ${PRECIO.anio.replace(",00", "")} a year or ${PRECIO.mes} a month, with a ${PRECIO.pruebaDias}-day free trial.`,
    premium: "Try 7 days free",
    comprobando: "Checking your access…",
  },
};
const OIR = { es: "Escuchar el episodio", en: "Listen to the episode" };
const CARGANDO = { es: "Cargando el recorrido…", en: "Loading the walk-through…" };
const FALLO = { es: "No pudimos comprobar tu acceso. Vuelve a intentarlo en un momento.", en: "We couldn't check your access. Please try again in a moment." };

/**
 * Visor de La sala: encuadre object-cover, siempre lleno. La obra entera va a tamaño cover dentro de un nodo que se
 * transforma (solo transform) y `overflow: hidden` está solo en el visor exterior. `paso` mueve la cámara.
 */
function VisorObra({ src, obraId, alt, paso, reducido, className, mascaras, children }: { src: string; obraId?: string; alt: string; paso: RecorridoVista["pasos"][number] | null; reducido: boolean; className: string; mascaras?: { pasos: RecorridoVista["pasos"]; activo: number }; children?: ReactNode }) {
  const [aspecto, setAspecto] = useState<number | null>(null);
  const [caja, setCaja] = useState<Caja>({ w: 390, h: 400 });
  const [movil, setMovil] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!src) return;
    const img = new window.Image();
    img.onload = () => img.naturalHeight && setAspecto(img.naturalWidth / img.naturalHeight);
    img.src = src;
  }, [src]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) setCaja({ w: r.width, h: r.height });
      setMovil(window.innerWidth < 768);
    };
    medir();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", medir);
      return () => window.removeEventListener("resize", medir);
    }
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { ancho, alto, ...pose } = transformaPaso(paso, aspecto, caja, movil);
  // Máscara de iluminación: una capa estática por paso (degradado radial fijo); solo se funde con opacity. Nunca con movimiento reducido.
  const capas = mascaras && !reducido ? mascaras.pasos : [];
  return (
    <div ref={ref} className={`relative overflow-hidden bg-[#0C0B09] ${className}`} data-obra={obraId} data-zoom={paso && !reducido ? paso.zoom : 1} data-mascara={capas.length && mascaras && mascaras.activo >= 0 ? `paso-${mascaras.activo + 1}` : "ninguna"} data-visor>
      <div className="absolute left-0 top-0 will-change-transform" style={{ width: ancho, height: alto, ...pose, transition: reducido ? "none" : "transform 800ms cubic-bezier(0.22, 0.61, 0.36, 1)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} fetchPriority="high" loading="eager" decoding="sync" className="sala-obra h-full w-full object-cover" />
      </div>
      {capas.map((p, i) => (
        <div key={i} aria-hidden="true" data-capa-mascara={i + 1} className="pointer-events-none absolute inset-0" style={{ backgroundImage: fondoMascara(geometriaMascara(p, aspecto, caja, movil)), opacity: mascaras?.activo === i ? 1 : 0, transition: "opacity 750ms ease" }} />
      ))}
      {children}
    </div>
  );
}

function Tarjeta({ children }: { children: ReactNode }) {
  return <div className="max-w-prose rounded-2xl border border-[#2E2924] bg-[#1B1815] p-5 md:p-7">{children}</div>;
}

function Apertura({ a }: { a: Adelanto }) {
  return (
    <>
      <h2 className="font-display text-2xl">{a.titulo}</h2>
      <p className="mt-3 max-w-prose text-lg leading-relaxed text-[#F4ECE2]/90">{a.texto}</p>
    </>
  );
}

/** Punto de corte: llamada a premium; «Entrar» solo sin sesión. `verificando`: hay sesión y aún no se sabe el acceso. */
export function CorteSala({ lang, vista, hrefEntrar, verificando = false, fallo = false }: { lang: "es" | "en"; vista: Exclude<VistaSala, "premium">; hrefEntrar: string; verificando?: boolean; fallo?: boolean }) {
  const c = CORTE[lang];
  const copy = textosAlta(lang);
  return (
    <section data-corte data-candado aria-busy={verificando} className="mt-3 max-w-prose rounded-3xl border border-[#C9A96E]/60 bg-[#1B1815] p-5 md:mt-8 md:p-6">
      <h2 className="font-display text-xl">{c.titulo}</h2>
      {fallo ? <p role="status" className="mt-2 text-[#F4ECE2]/85">{FALLO[lang]}</p> : null}
      <p className="mt-2 text-base leading-relaxed text-[#F4ECE2]/90">{c.texto}</p>
      {verificando ? (
        <p role="status" className="mt-4 text-[#B7AB9C]">{c.comprobando}</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/${lang}/membresia`} data-cta="premium" className="inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{c.premium}</Link>
          {vista === "sin-sesion" ? (
            <Link href={hrefEntrar} data-cta="entrar" className="inline-flex min-h-12 items-center rounded-full border border-[#C9A96E] px-6 text-[#C9A96E]">{copy.entrar}</Link>
          ) : null}
        </div>
      )}
    </section>
  );
}

/** Relato con scroll (solo premium): párrafos que aparecen uno a uno y cámara que encuadra el paso en foco. */
export function RelatoScroll({ lang, id, src, obraId, alt, titulo, datos, contexto, placa, reducido: reducidoInicial = false }: { lang: "es" | "en"; id: string; src: string; obraId?: string; alt: string; titulo: string; datos: RecorridoVista; contexto?: ContextoSala | null; placa?: ReactNode; reducido?: boolean }) {
  const [reducido, setReducido] = useState(reducidoInicial);
  const [activo, setActivo] = useState(0);
  const [reveladas, setReveladas] = useState<ReadonlySet<number>>(new Set([0]));
  const bloques = useRef<(HTMLElement | null)[]>([]);
  const visor = useRef<HTMLDivElement>(null);
  const total = datos.pasos.length;
  const [cab, setCab] = useState(0);

  // El visor sticky en móvil cuelga bajo la cabecera sticky del sitio: se mide su alto.
  useEffect(() => {
    const medir = () => setCab(Math.round(document.querySelector<HTMLElement>("[data-cabecera]")?.getBoundingClientRect().height ?? 0));
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducido(mq.matches);
    const cambia = () => setReducido(mq.matches);
    mq.addEventListener?.("change", cambia);
    return () => mq.removeEventListener?.("change", cambia);
  }, []);

  useEffect(() => {
    if (reducido) return;
    const marcar = (i: number) => setReveladas((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
    if (typeof IntersectionObserver === "undefined") {
      for (let i = 0; i <= total + 1; i++) marcar(i);
      return;
    }
    const io = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => e.isIntersecting && marcar(Number((e.target as HTMLElement).dataset.indice))),
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    bloques.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [reducido, total]);

  useEffect(() => {
    if (reducido) return;
    let cuadro = 0;
    const calcular = () => {
      cuadro = 0;
      const vh = window.innerHeight;
      // Móvil: el visor es sticky arriba y el texto pasa por debajo; la franja de texto empieza en su borde inferior.
      const base = window.innerWidth < 768 ? (visor.current?.getBoundingClientRect().bottom ?? 0) : 0;
      // Línea de foco cerca del borde superior de la franja de texto: el paso se activa cuando su título entra.
      const linea = base + (vh - base) * (base ? 0.3 : 0.4);
      const titulos = bloques.current.map((el) => {
        if (!el) return Infinity;
        return (el.querySelector("h2, h3") ?? el).getBoundingClientRect().top;
      });
      setActivo(indiceActivo(titulos, linea));
    };
    const pide = () => {
      if (!cuadro) cuadro = requestAnimationFrame(calcular);
    };
    calcular();
    window.addEventListener("scroll", pide, { passive: true });
    window.addEventListener("resize", pide);
    return () => {
      window.removeEventListener("scroll", pide);
      window.removeEventListener("resize", pide);
      if (cuadro) cancelAnimationFrame(cuadro);
    };
  }, [reducido, total]);

  const indice = reducido ? 0 : activo;
  const paso = reducido ? null : poseDeBloque(indice, datos.pasos);
  const estilo = (i: number) => {
    const op = opacidadBloque({ revelado: reveladas.has(i), activo: indice === i }, reducido);
    return reducido ? undefined : { opacity: op, transform: op === 0 ? "translateY(14px)" : "none", transition: "opacity 700ms ease, transform 700ms ease" };
  };
  // Cada bloque ocupa la franja de texto visible (móvil: pantalla − cabecera − visor), un paso por franja.
  const clase = "flex min-h-[max(30svh,calc(100svh_-_var(--cab,76px)_-_62svh))] flex-col justify-center py-4 md:min-h-[78svh] md:py-8";
  const ref = (i: number) => (el: HTMLElement | null) => {
    bloques.current[i] = el;
  };
  const enPaso = indice >= 1 && indice <= total;
  return (
    <main className="bg-[#0C0B09] text-[#F4ECE2]" data-vista="premium" data-camara={etiquetaCamara(indice, total)} data-paso-activo={etiquetaActivo(indice, total)} data-reducido={reducido ? "" : undefined} style={{ "--cab": `${cab || 76}px` } as CSSProperties}>
      <div className="md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div ref={visor} className="sticky top-[var(--cab)] z-20 md:top-0 md:z-10 md:h-svh md:self-start">
          <VisorObra src={src} obraId={obraId} alt={alt} paso={paso} reducido={reducido} className="h-[62svh] md:h-svh" mascaras={{ pasos: datos.pasos, activo: enPaso ? indice - 1 : -1 }}>
            {enPaso ? (
              <p data-contador aria-hidden="true" className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-[#100E0C]/80 px-3 py-1 text-sm tabular-nums text-[#E0C48A] md:right-5 md:bottom-5">{indice} / {total}</p>
            ) : null}
          </VisorObra>
        </div>
        <div className="relative z-10 -mt-5 rounded-t-3xl bg-[#0C0B09] px-4 pb-[30svh] shadow-[0_-14px_24px_rgba(0,0,0,0.55)] md:z-auto md:mt-0 md:rounded-none md:shadow-none md:px-10">
          <h1 className="font-display t-h1 pt-6 md:pt-[12svh]">{titulo}</h1>
          <article data-apertura data-indice={0} data-bloque ref={ref(0)} className={clase} style={estilo(0)}>
            <Tarjeta>
              <Apertura a={datos.apertura} />
            </Tarjeta>
          </article>
          <ContextoReportaje contexto={contexto} lang={lang} />
          {datos.pasos.map((p, i) => (
            <article key={i} data-paso={i + 1} data-indice={i + 1} data-bloque ref={ref(i + 1)} className={clase} style={estilo(i + 1)}>
              <Tarjeta>
                <p className="font-display text-3xl leading-none text-[#C9A96E]">{i + 1}</p>
                <h3 className="mt-2 font-display text-xl">{p.titulo}</h3>
                <p className="mt-2 max-w-prose text-lg leading-relaxed text-[#F4ECE2]/90">{p.texto}</p>
              </Tarjeta>
            </article>
          ))}
          <article data-cierre data-indice={total + 1} data-bloque ref={ref(total + 1)} className={clase} style={estilo(total + 1)}>
            <Tarjeta>
              <Apertura a={datos.cierre} />
            </Tarjeta>
          </article>
          <div className="mt-6 grid gap-6">
            {placa ? <div className="max-w-sm">{placa}</div> : null}
            <Link href={`/${lang}/oir/${id}`} className="inline-flex min-h-12 w-fit items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{OIR[lang]}</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

const SESION_MOCK = { sin: null, gratis: { userId: "mock" }, premium: { userId: "mock" } } as const;

/**
 * La sala en tres estados. Sin sesión y cuenta gratuita: obra, título y apertura (adelanto público) más el corte.
 * Premium: relato con scroll. El estado lo decide el SERVIDOR (`acceso` de /api/sala/[id]); aquí nunca se asume premium.
 * `sesionMock` solo se usa fuera de producción (capturas).
 */
export function SalaCuenta({
  lang,
  id,
  src,
  obraId,
  alt,
  titulo,
  adelanto,
  contexto,
  placa,
  sesionMock,
}: {
  lang: "es" | "en";
  id: string;
  src: string;
  obraId?: string;
  alt: string;
  titulo: string;
  adelanto?: Adelanto;
  contexto?: ContextoSala | null;
  placa?: ReactNode;
  sesionMock?: MockSala;
}) {
  const mock = sesionMock !== undefined;
  const [sesion, setSesion] = useState<{ userId: string } | null | undefined>(mock ? SESION_MOCK[sesionMock] : undefined);
  const [respuesta, setRespuesta] = useState<RespuestaSala | null>(null);
  const [fallo, setFallo] = useState(false);
  useEffect(() => {
    if (mock) return;
    void sesionWeb().then(setSesion).catch(() => setSesion(null));
  }, [mock]);
  const userId = sesion?.userId;
  useEffect(() => {
    if (!userId) {
      setRespuesta(null);
      setFallo(false);
      return;
    }
    let vivo = true;
    void (async () => {
      try {
        const cabeceras: Record<string, string> = {};
        if (mock) cabeceras["x-sala-mock"] = sesionMock;
        else {
          const token = await tokenWeb();
          if (!token) throw new Error("sin-token");
          cabeceras.Authorization = `Bearer ${token}`;
        }
        const r = await fetch(`/api/sala/${encodeURIComponent(id)}?lang=${lang}`, { headers: cabeceras, cache: "no-store" });
        if (!r.ok) throw new Error("carga");
        const json = (await r.json()) as RespuestaSala;
        if (vivo) setRespuesta(json);
      } catch {
        if (vivo) setFallo(true);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [userId, id, lang, mock, sesionMock]);

  const { vista, hrefEntrar } = datosVistaSala(sesion, id, lang, respuesta?.acceso);
  if (vista === "premium" && respuesta?.acceso === "premium") {
    return <RelatoScroll lang={lang} id={id} src={src} obraId={obraId} alt={alt} titulo={titulo} datos={respuesta} contexto={contexto} placa={placa} />;
  }
  const apertura = respuesta?.apertura ?? adelanto;
  const verificando = !!userId && !respuesta && !fallo;
  return (
    <main className="bg-[#0C0B09] pb-28 text-[#F4ECE2]" data-vista={vista}>
      <VisorObra src={src} obraId={obraId} alt={alt} paso={null} reducido className="h-[56svh] md:h-[68svh]" />
      <div className="mx-auto w-full max-w-3xl px-5 pt-4 md:px-8 md:pt-8">
        <h1 className="font-display t-h1 max-md:!text-[1.75rem]">{titulo}</h1>
        {apertura ? (
          <div data-apertura className="mt-3 md:mt-4">
            <Apertura a={apertura} />
          </div>
        ) : null}
        <ContextoReportaje contexto={contexto} lang={lang} />
        <CorteSala lang={lang} vista={vista === "premium" ? "gratuito" : vista} hrefEntrar={hrefEntrar} verificando={verificando} fallo={fallo} />
      </div>
    </main>
  );
}
