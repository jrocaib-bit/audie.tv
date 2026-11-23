"use client";

import { textosAlta, type Sesion } from "@audite/domain";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Lienzo } from "@/components/sala/lienzo";
import { sesionWeb } from "@/lib/auth-web";
import { datosVistaSala, type RecorridoVista } from "@/lib/sala-cuenta";

const INVITA = {
  es: "Crea tu cuenta gratis o entra para recorrer la obra, con sus textos y detalles.",
  en: "Create your free account or sign in to walk through the work, with its texts and details.",
};
const CREAR = { es: "Crear cuenta", en: "Create account" };
const OIR = { es: "Escuchar el episodio", en: "Listen to the episode" };
const VER = { es: "Ver en la obra", en: "Look at this detail" };
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

function VisorObra({ src, obraId, alt, paso }: { src: string; obraId?: string; alt: string; paso: Paso | null }) {
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
    <div className="h-[62svh] overflow-hidden md:h-[70svh]" data-zoom={paso ? paso.zoom : 1}>
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
  resumen,
  recorrido,
  placa,
  sesionMock,
}: {
  lang: "es" | "en";
  id: string;
  src: string;
  obraId?: string;
  alt: string;
  titulo: string;
  resumen: string;
  recorrido?: RecorridoVista | null;
  placa?: ReactNode;
  sesionMock?: Pick<Sesion, "userId"> | null;
}) {
  const copy = textosAlta(lang);
  const [sesion, setSesion] = useState<Pick<Sesion, "userId"> | null | undefined>(sesionMock);
  const [activo, setActivo] = useState<number | null>(null);
  useEffect(() => {
    if (sesionMock !== undefined) return;
    void sesionWeb().then(setSesion).catch(() => setSesion(null));
  }, [sesionMock]);
  const { vista, hrefEntrar, recorrido: rec } = datosVistaSala(sesion, id, lang);
  // Sin sesión no se pinta ningún texto narrativo aunque el servidor lo haya enviado.
  const datos = vista === "recorrido" ? (rec ?? recorrido ?? null) : null;
  const paso = datos && activo !== null ? (datos.pasos[activo] ?? null) : null;

  return (
    <main className="bg-[#0C0B09] pb-28 text-[#F4ECE2]" data-vista={vista}>
      <VisorObra src={src} obraId={obraId} alt={alt} paso={paso} />
      <div className="mx-auto w-full max-w-3xl px-5 pt-6 md:px-8">
        <h1 className="font-display t-h1">{titulo}</h1>
        {vista === "recorrido" ? (
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
              <p className="max-w-prose text-lg leading-relaxed text-[#F4ECE2]/90">{resumen}</p>
            )}
            {placa ? <div className="max-w-sm">{placa}</div> : null}
            <Link href={`/${lang}/oir/${id}`} className="inline-flex min-h-12 w-fit items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{OIR[lang]}</Link>
          </section>
        ) : (
          <section data-candado className="mt-6 max-w-prose rounded-3xl border border-[#2E2924] bg-[#1B1815] p-6">
            <p className="text-lg leading-relaxed text-[#F4ECE2]/90">{INVITA[lang]}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={hrefEntrar} className="inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{CREAR[lang]}</Link>
              <Link href={hrefEntrar} className="inline-flex min-h-12 items-center rounded-full border border-[#C9A96E] px-6 text-[#C9A96E]">{copy.entrar}</Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
