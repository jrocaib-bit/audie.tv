"use client";

import { PRECIO } from "@audite/domain";
import Link from "next/link";
import { useEffect, useState } from "react";

type Copy = {
  homeCta: string;
  ctaGhost: string;
  ctaDays: string;
  ctaDownload: string;
  ctaNotify: string;
  ctaEmail: string;
  ctaReady: string;
  ctaSign: string;
  ctaRisk: string;
};

const PERIODO: Record<string, { mes: string; anio: string; o: string; ahorro: string; gratis: string }> = {
  es: { mes: "mes", anio: "año", o: "o", ahorro: "Ahorra un 66 %", gratis: "7 días gratis" },
  en: { mes: "mo", anio: "yr", o: "or", ahorro: "Save 66%", gratis: "7 days free" },
  it: { mes: "mese", anio: "anno", o: "o", ahorro: "Risparmi il 66 %", gratis: "7 giorni gratis" },
  pt: { mes: "mês", anio: "ano", o: "ou", ahorro: "Poupa 66 %", gratis: "7 dias grátis" },
  fr: { mes: "mois", anio: "an", o: "ou", ahorro: "Économise 66 %", gratis: "7 jours gratuits" },
  de: { mes: "Monat", anio: "Jahr", o: "oder", ahorro: "66 % sparen", gratis: "7 Tage gratis" },
  zh: { mes: "月", anio: "年", o: "或", ahorro: "省 66%", gratis: "免费 7 天" },
};

function periodo(lang: string) {
  return PERIODO[lang] ?? PERIODO.es;
}

export function lineaPrecio(lang: string): string {
  const texto = periodo(lang);
  return `${PRECIO.mes}/${texto.mes} ${texto.o} ${PRECIO.anio}/${texto.anio}`;
}

export function Planes({ lang, cta, riesgo }: { lang: string; cta: string; riesgo: string }) {
  const texto = periodo(lang);
  const [plan, setPlan] = useState<"anio" | "mes">("anio");
  const anual = plan === "anio";
  const cifra = anual ? `${PRECIO.anio}/${texto.anio}` : `${PRECIO.mes}/${texto.mes}`;
  return (
    <div className="mt-8 max-w-xl">
      <p className="font-display text-3xl text-[#F4ECE2] md:text-4xl">{texto.gratis}</p>
      <article className="mt-6 rounded-3xl bg-[#1B1815] px-6 py-8 md:px-8">
        <p className="text-sm text-[#C9A96E]">{PRECIO.anio}/{texto.anio} · {texto.ahorro}</p>
        <p className="font-display mt-4 text-5xl leading-none text-[#F4ECE2] md:text-7xl">{cifra}</p>
        <div className="mt-6 flex gap-2">
          <button type="button" aria-pressed={anual} className={`min-h-11 rounded-full px-4 ${anual ? "bg-[#C9A96E] text-[#100E0C]" : "text-[#F4ECE2]"}`} onClick={() => setPlan("anio")}>{PRECIO.anio}/{texto.anio}</button>
          <button type="button" aria-pressed={!anual} className={`min-h-11 rounded-full px-4 ${anual ? "text-[#B7AB9C]" : "bg-[#C9A96E] text-[#100E0C]"}`} onClick={() => setPlan("mes")}>{PRECIO.mes}/{texto.mes}</button>
        </div>
        <Link href="/escuchar" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{cta}</Link>
        <p className="mt-3 text-base text-[#B7AB9C]">{riesgo}</p>
      </article>
    </div>
  );
}

export function CtaPar({ lang, etiqueta, ghost }: { lang: string; etiqueta: string; ghost: string }) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <Link href="/escuchar" className="inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{etiqueta}</Link>
      <Link href={`/${lang}/entrar`} className="inline-flex min-h-12 items-center rounded-full border border-[#F4ECE2]/30 px-6 text-[#F4ECE2]">{ghost}</Link>
    </div>
  );
}

export function tiendas(): { appStore: string; play: string } {
  return {
    appStore: process.env.NEXT_PUBLIC_AUDITE_APP_STORE_URL?.trim() ?? "",
    play: process.env.NEXT_PUBLIC_AUDITE_PLAY_URL?.trim() ?? "",
  };
}

export function Ctas({ lang, copy, invertido = false, precio = false }: { lang: string; copy: Copy; invertido?: boolean; precio?: boolean }) {
  const [aviso, setAviso] = useState(false);
  const enlaces = tiendas();
  const vacias = !enlaces.appStore && !enlaces.play;
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <Link href="/escuchar" className="inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">
        {copy.homeCta}
      </Link>
      {vacias ? (
        <button type="button" className={`inline-flex min-h-12 items-center rounded-full border px-6 ${invertido ? "border-[#F4ECE2]/40 text-[#F4ECE2]" : "border-border"}`} onClick={() => setAviso(true)}>
          {copy.ctaDownload}
        </button>
      ) : (
        <>
          {enlaces.appStore ? <a className="inline-flex min-h-12 items-center rounded-full border border-border px-6" href={enlaces.appStore}>App Store</a> : null}
          {enlaces.play ? <a className="inline-flex min-h-12 items-center rounded-full border border-border px-6" href={enlaces.play}>Google Play</a> : null}
        </>
      )}
      <Link href={`/${lang}/entrar`} className="inline-flex min-h-12 items-center rounded-full border border-[#F4ECE2]/30 px-6 text-[#F4ECE2]">
        {copy.ctaGhost}
      </Link>
      {precio ? <span className={`text-sm ${invertido ? "text-[#E7D7C3]" : "text-muted"}`}>{lineaPrecio(lang)}</span> : null}
      {aviso ? <Avisame copy={copy} onClose={() => setAviso(false)} /> : null}
    </div>
  );
}

export function Avisame({ copy, onClose }: { copy: Copy; onClose: () => void }) {
  const [correo, setCorreo] = useState("");
  const [listo, setListo] = useState(false);
  return (
    <form
      className="mt-3 flex w-full max-w-md flex-wrap gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        // TODO: enviar el correo cuando haya un destino. No hay backend.
        if (!correo.trim()) return;
        setListo(true);
      }}
    >
      <input
        type="email"
        required
        value={correo}
        aria-label={copy.ctaEmail}
        placeholder={copy.ctaEmail}
        onChange={(event) => setCorreo(event.target.value)}
        className="min-h-12 min-w-0 flex-1 rounded-full border border-border bg-transparent px-4"
      />
      <button type="submit" className="inline-flex min-h-12 items-center rounded-full bg-primary px-5 text-primary-foreground">{listo ? copy.ctaReady : copy.ctaNotify}</button>
      <button type="button" className="inline-flex min-h-12 items-center px-3" onClick={onClose}>×</button>
    </form>
  );
}

export function BarraFija({ lang, copy }: { lang: string; copy: Copy }) {
  const [visible, setVisible] = useState(false);
  const [aviso, setAviso] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const observer = new IntersectionObserver(([entrada]) => setVisible(!entrada?.isIntersecting), { threshold: 0 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  if (!visible) return null;
  const enlaces = tiendas();
  const vacias = !enlaces.appStore && !enlaces.play;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 md:hidden">
      {aviso ? <Avisame copy={copy} onClose={() => setAviso(false)} /> : null}
      <p className="mb-2 text-center text-sm">{lineaPrecio(lang)}</p>
      <div className="flex gap-2">
        <Link href="/escuchar" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#C9A96E] px-4 text-[#100E0C]">
          {copy.homeCta}
        </Link>
        {vacias ? (
          <button type="button" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-border px-4" onClick={() => setAviso(true)}>
            {copy.ctaDownload}
          </button>
        ) : (
          <a href={enlaces.appStore || enlaces.play} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-border px-4">{copy.ctaDownload}</a>
        )}
      </div>
    </div>
  );
}
