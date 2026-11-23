"use client";

import { textosAlta, type Sesion } from "@audite/domain";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Lienzo } from "@/components/sala/lienzo";
import { sesionWeb, tokenWeb } from "@/lib/auth-web";
import { datosVistaSala, type RecorridoVista } from "@/lib/sala-cuenta";

const INVITA = {
  es: "Crea tu cuenta gratis o entra para recorrer la obra, con sus textos y detalles.",
  en: "Create your free account or sign in to walk through the work, with its texts and details.",
};
const CREAR = { es: "Crear cuenta", en: "Create account" };
const OIR = { es: "Escuchar el episodio", en: "Listen to the episode" };
const VER = { es: "Ver en la obra", en: "Look at this detail" };
const CARGANDO = { es: "Cargando el recorrido…", en: "Loading the walk-through…" };
const FALLO = { es: "No pudimos cargar el recorrido. Vuelve a intentarlo en un momento.", en: "We couldn't load the walk-through. Please try again in a moment." };
const TODA = { es: "Ver la obra entera", en: "See the whole work" };

type Paso = RecorridoVista["pasos"][number];

/** Transformación que centra el punto (x, y) normalizado de la obra y la acerca `zoom` veces. */
function transformaPaso(paso: Paso | null, aspecto: number | null, caja: { w: number; h: number }) {
  if (!paso) return { transform: "none", transformOrigin: "50% 50%" };
  // La obra va con object-contain: calcula su rectángulo dentro de la caja.
  const r = aspecto ?? caja.w / caja.h;
  const w = Math.min(caja.w, caja.h * r);
  const h = w / r;
  const px = (caja.w - w) / 2 + paso.x * w;
  const py = (caja.h - h) / 2 + paso.y * h;
  const tx = caja.w / 2 - px * paso.zoom;
  const ty = caja.h / 2 - py * paso.zoom;
  return { transform: `translate(${tx}px, ${ty}px) scale(${paso.zoom})`, transformOrigin: "0 0" };
}

function VisorObra({ src, obraId, alt, paso, adelanto = false }: { src: string; obraId?: string; alt: string; paso: Paso | null; adelanto?: boolean }) {
  const [aspecto, setAspecto] = useState<number | null>(null);
  const [caja, setCaja] = useState({ w: 1280, h: 700 });
  useEffect(() => {
    if (!src) return;
    const img = new window.Image();
    img.onload = () => img.naturalHeight && setAspecto(img.naturalWidth / img.naturalHeight);
    img.src = src;
  }, [src]);
  useEffect(() => {
    const medir = () => setCaja({ w: window.innerWidth, h: Math.round(window.innerHeight * (window.innerWidth >= 768 ? 0.7 : 0.62)) });
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);
  return (
    <div className={adelanto ? "min-h-0 flex-1 overflow-hidden" : "h-[62svh] overflow-hidden md:h-[70svh]"} data-zoom={paso ? paso.zoom : 1}>
      <div className="h-full w-full transition-transform duration-700 ease-out motion-reduce:transition-none" style={transformaPaso(paso, aspecto, caja)}>
        <Lienzo src={src} obraId={obraId} alt={alt} priority className="h-full" />
      </div>
    </div>
  );
}

/** Adelanto (obra + título) para todos; el recorrido y sus textos, solo con sesión. `sesionMock` es solo para capturas en desarrollo. */
export function SalaCuenta({
  lang,
  id,
  src,
  obraId,
  alt,
  titulo,
  placa,
  sesionMock,
}: {
  lang: "es" | "en";
  id: string;
  src: string;
  obraId?: string;
  alt: string;
  titulo: string;
  placa?: ReactNode;
  sesionMock?: Pick<Sesion, "userId"> | null;
}) {
  const copy = textosAlta(lang);
  const [sesion, setSesion] = useState<Pick<Sesion, "userId"> | null | undefined>(sesionMock);
  const [datos, setDatos] = useState<RecorridoVista | null>(null);
  const [fallo, setFallo] = useState(false);
  const [activo, setActivo] = useState<number | null>(null);
  useEffect(() => {
    if (sesionMock !== undefined) return;
    void sesionWeb().then(setSesion).catch(() => setSesion(null));
  }, [sesionMock]);
  const { vista, hrefEntrar } = datosVistaSala(sesion, id, lang);
  // El servidor no envía el recorrido: con sesión confirmada se pide a un endpoint que verifica el token.
  useEffect(() => {
    if (vista !== "recorrido") {
      setDatos(null);
      setFallo(false);
      return;
    }
    let vivo = true;
    const cabeceras: Record<string, string> = {};
    void (async () => {
      try {
        // `sesionMock` solo existe fuera de producción (capturas): el endpoint solo lo acepta fuera de producción.
        if (sesionMock !== undefined) cabeceras["x-sala-mock"] = "1";
        else {
          const token = await tokenWeb();
          if (!token) throw new Error("sin-token");
          cabeceras.Authorization = `Bearer ${token}`;
        }
        const r = await fetch(`/api/sala/${encodeURIComponent(id)}?lang=${lang}`, { headers: cabeceras, cache: "no-store" });
        if (!r.ok) throw new Error("carga");
        const json = (await r.json()) as RecorridoVista;
        if (vivo) setDatos(json);
      } catch {
        if (vivo) setFallo(true);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [vista, id, lang, sesionMock]);
  const paso = datos && activo !== null ? (datos.pasos[activo] ?? null) : null;

  if (vista === "adelanto") {
    return (
      <main className="bg-[#0C0B09] text-[#F4ECE2]" data-vista="adelanto">
        <div data-primera-pantalla className="flex h-[calc(100svh-11.5rem)] min-h-[22rem] flex-col md:h-[calc(100svh-6.5rem)]">
          <VisorObra src={src} obraId={obraId} alt={alt} paso={null} adelanto />
          <div className="mx-auto w-full max-w-3xl shrink-0 px-5 pb-4 pt-3 md:px-8 md:pb-6">
            <h1 className="font-display t-h1">{titulo}</h1>
            <section data-candado className="mt-3 max-w-prose rounded-3xl border border-[#2E2924] bg-[#1B1815] p-4 md:p-6">
              <p className="text-base leading-relaxed text-[#F4ECE2]/90 md:text-lg">{INVITA[lang]}</p>
              <div className="mt-3 flex flex-wrap gap-3 md:mt-5">
                <Link href={hrefEntrar} className="inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{CREAR[lang]}</Link>
                <Link href={hrefEntrar} className="inline-flex min-h-12 items-center rounded-full border border-[#C9A96E] px-6 text-[#C9A96E]">{copy.entrar}</Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#0C0B09] pb-28 text-[#F4ECE2]" data-vista="recorrido">
      <VisorObra src={src} obraId={obraId} alt={alt} paso={paso} />
      <div className="mx-auto w-full max-w-3xl px-5 pt-6 md:px-8">
        <h1 className="font-display t-h1">{titulo}</h1>
        <section aria-label={titulo} className="mt-6 grid gap-8">
            {datos ? (
              <>
                <div data-apertura>
                  <h2 className="font-display text-2xl">{datos.apertura.titulo}</h2>
                  <p className="mt-3 max-w-prose text-lg leading-relaxed text-[#F4ECE2]/90">{datos.apertura.texto}</p>
                </div>
                <ol className="grid gap-4" data-pasos>
                  {datos.pasos.map((p, i) => (
                    <li key={i} data-paso={i + 1} className={`rounded-3xl border p-5 ${activo === i ? "border-[#C9A96E] bg-[#1B1815]" : "border-[#2E2924]"}`}>
                      <p className="text-sm tracking-wide text-[#C9A96E]">{i + 1}</p>
                      <h3 className="font-display text-xl">{p.titulo}</h3>
                      <p className="mt-2 max-w-prose leading-relaxed text-[#F4ECE2]/85">{p.texto}</p>
                      <button
                        type="button"
                        aria-pressed={activo === i}
                        onClick={() => setActivo(activo === i ? null : i)}
                        className="mt-4 inline-flex min-h-11 items-center rounded-full border border-[#C9A96E] px-5 text-[#C9A96E]"
                      >
                        {activo === i ? TODA[lang] : VER[lang]}
                      </button>
                    </li>
                  ))}
                </ol>
                <div data-cierre>
                  <h2 className="font-display text-2xl">{datos.cierre.titulo}</h2>
                  <p className="mt-3 max-w-prose text-lg leading-relaxed text-[#F4ECE2]/90">{datos.cierre.texto}</p>
                </div>
              </>
            ) : (
              <p role="status" className="max-w-prose text-lg leading-relaxed text-[#F4ECE2]/90">{fallo ? FALLO[lang] : CARGANDO[lang]}</p>
            )}
            {placa ? <div className="max-w-sm">{placa}</div> : null}
            <Link href={`/${lang}/oir/${id}`} className="inline-flex min-h-12 w-fit items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{OIR[lang]}</Link>
        </section>
      </div>
    </main>
  );
}
