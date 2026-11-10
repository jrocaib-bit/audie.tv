"use client";

import { PRECIO } from "@audite/domain";
import Link from "next/link";
import { useEffect, useState } from "react";

type Copy = {
  homeCta: string;
  ctaDays: string;
  ctaDownload: string;
  ctaNotify: string;
  ctaEmail: string;
  ctaReady: string;
  ctaSign: string;
};

const PERIODO: Record<string, [string, string]> = {
  es: ["mes", "año"],
  en: ["mo", "yr"],
  it: ["mese", "anno"],
  pt: ["mês", "ano"],
  fr: ["mois", "an"],
  de: ["Monat", "Jahr"],
  zh: ["月", "年"],
};

export function lineaPrecio(lang: string): string {
  const [mes, anio] = PERIODO[lang] ?? PERIODO.es;
  return `${PRECIO.mes}/${mes} · ${PRECIO.anio}/${anio}`;
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
      <Link href="/escuchar" className={`inline-flex min-h-12 items-center rounded-full px-6 ${invertido ? "bg-[#C9A96E] text-[#100E0C]" : "bg-primary text-primary-foreground"}`}>
        {copy.homeCta}
        <span className="ml-2 text-sm opacity-80">{copy.ctaDays}</span>
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
      <Link href={`/${lang}/entrar`} className={`inline-flex min-h-12 items-center text-sm ${invertido ? "text-[#F4ECE2]" : "text-muted"}`}>
        {copy.ctaSign}
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
        <Link href="/escuchar" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-primary px-4 text-primary-foreground">
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
