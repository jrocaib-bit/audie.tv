"use client";

import { PRECIO, textosAlta } from "@audite/domain";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Lienzo } from "@/components/sala/lienzo";
import { sesionWeb, tokenWeb } from "@/lib/auth-web";
import { datosVistaSala, type Adelanto, type RecorridoVista, type RespuestaSala, type VistaSala } from "@/lib/sala-cuenta";
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

/** Visor de la obra completa (object-contain). `paso` mueve la cámara solo con transform. */
function VisorObra({ src, obraId, alt, paso, reducido, className }: { src: string; obraId?: string; alt: string; paso: RecorridoVista["pasos"][number] | null; reducido: boolean; className: string }) {
  const [aspecto, setAspecto] = useState<number | null>(null);
  const [caja, setCaja] = useState<Caja>({ w: 390, h: 400 });
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
  const estilo = reducido ? { transform: "none", transformOrigin: "0 0" } : transformaPaso(paso, aspecto, caja);
  return (
    <div ref={ref} className={`overflow-hidden bg-[#0C0B09] ${className}`} data-zoom={paso && !reducido ? paso.zoom : 1} data-visor>
      <div className="h-full w-full will-change-transform" style={{ ...estilo, transition: reducido ? "none" : "transform 800ms cubic-bezier(0.22, 0.61, 0.36, 1)" }}>
        <Lienzo src={src} obraId={obraId} alt={alt} priority className="h-full" />
      </div>
    </div>
  );
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
    <section data-corte data-candado aria-busy={verificando} className="mt-8 max-w-prose rounded-3xl border border-[#C9A96E]/60 bg-[#1B1815] p-5 md:p-6">
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
export function RelatoScroll({ lang, id, src, obraId, alt, titulo, datos, placa, reducido: reducidoInicial = false }: { lang: "es" | "en"; id: string; src: string; obraId?: string; alt: string; titulo: string; datos: RecorridoVista; placa?: ReactNode; reducido?: boolean }) {
  const [reducido, setReducido] = useState(reducidoInicial);
  const [activo, setActivo] = useState(0);
  const [reveladas, setReveladas] = useState<ReadonlySet<number>>(new Set([0]));
  const bloques = useRef<(HTMLElement | null)[]>([]);
  const visor = useRef<HTMLDivElement>(null);
  const total = datos.pasos.length;

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
      // En móvil el visor es sticky arriba: el foco se mide en la franja de texto de debajo.
      const base = window.innerWidth < 768 ? (visor.current?.getBoundingClientRect().bottom ?? 0) : 0;
      const linea = base + (vh - base) * 0.45;
      const centros = bloques.current.map((el) => {
        if (!el) return Infinity;
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2;
      });
      setActivo(indiceActivo(centros, linea));
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
  const clase = "flex min-h-[48svh] flex-col justify-center py-6 md:min-h-[62svh]";
  const ref = (i: number) => (el: HTMLElement | null) => {
    bloques.current[i] = el;
  };
  return (
    <main className="bg-[#0C0B09] text-[#F4ECE2]" data-vista="premium" data-camara={etiquetaCamara(indice, total)} data-paso-activo={etiquetaActivo(indice, total)} data-reducido={reducido ? "" : undefined}>
      <div className="md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div ref={visor} className="sticky top-0 z-10 md:h-svh md:self-start">
          <VisorObra src={src} obraId={obraId} alt={alt} paso={paso} reducido={reducido} className="h-[44svh] md:h-svh" />
        </div>
        <div className="px-5 pb-[30svh] md:px-10">
          <h1 className="font-display t-h1 pt-6 md:pt-[12svh]">{titulo}</h1>
          <article data-apertura data-indice={0} data-bloque ref={ref(0)} className={clase} style={estilo(0)}>
            <Apertura a={datos.apertura} />
          </article>
          {datos.pasos.map((p, i) => (
            <article key={i} data-paso={i + 1} data-indice={i + 1} data-bloque ref={ref(i + 1)} className={clase} style={estilo(i + 1)}>
              <p className="text-sm tracking-wide text-[#C9A96E]">{i + 1}</p>
              <h3 className="font-display text-xl">{p.titulo}</h3>
              <p className="mt-2 max-w-prose text-lg leading-relaxed text-[#F4ECE2]/90">{p.texto}</p>
            </article>
          ))}
          <article data-cierre data-indice={total + 1} data-bloque ref={ref(total + 1)} className={clase} style={estilo(total + 1)}>
            <Apertura a={datos.cierre} />
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
    return <RelatoScroll lang={lang} id={id} src={src} obraId={obraId} alt={alt} titulo={titulo} datos={respuesta} placa={placa} />;
  }
  const apertura = respuesta?.apertura ?? adelanto;
  const verificando = !!userId && !respuesta && !fallo;
  return (
    <main className="bg-[#0C0B09] pb-28 text-[#F4ECE2]" data-vista={vista}>
      <VisorObra src={src} obraId={obraId} alt={alt} paso={null} reducido className="h-[44svh] md:h-[56svh]" />
      <div className="mx-auto w-full max-w-3xl px-5 pt-5 md:px-8 md:pt-8">
        <h1 className="font-display t-h1">{titulo}</h1>
        {apertura ? (
          <div data-apertura className="mt-4">
            <Apertura a={apertura} />
          </div>
        ) : null}
        <CorteSala lang={lang} vista={vista === "premium" ? "gratuito" : vista} hrefEntrar={hrefEntrar} verificando={verificando} fallo={fallo} />
      </div>
    </main>
  );
}
