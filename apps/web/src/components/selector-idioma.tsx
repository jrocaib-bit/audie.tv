"use client";

import { esIdioma, IDIOMAS } from "@audite/domain";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const NOMBRES: Record<(typeof IDIOMAS)[number], string> = {
  es: "ES",
  en: "EN",
  it: "IT",
  pt: "PT",
  fr: "FR",
  de: "DE",
  zh: "中文",
};

/** El audio solo existe en español. La interfaz sí está en todos. */
export function idiomaConAudio(idioma: (typeof IDIOMAS)[number]): boolean {
  return idioma === "es";
}

export function etiquetaIdioma(idioma: (typeof IDIOMAS)[number], ui: string): string {
  if (idiomaConAudio(idioma)) return NOMBRES[idioma];
  return `${NOMBRES[idioma]} · ${ui === "en" ? "Coming soon" : "Próximamente"}`;
}

export function SelectorIdioma({ lang, claro = false }: { lang: string; claro?: boolean }) {
  const router = useRouter();
  const actual = esIdioma(lang) ? lang : "es";
  return (
    <label className="inline-flex min-h-11 items-center">
      <span className="sr-only">{actual}</span>
      <select
        aria-label={actual}
        value={actual}
        className={`min-h-11 w-[4.5rem] max-w-full bg-transparent text-xs uppercase tracking-[0.14em] ${claro ? "text-[#F4ECE2]" : "text-foreground"}`}
        onChange={(event) => {
          const idioma = event.target.value;
          if (!esIdioma(idioma)) return;
          document.cookie = `audite.idioma=${idioma}; Path=/; Max-Age=31536000; SameSite=Lax`;
          localStorage.setItem("audite.idioma", idioma);
          const resto = window.location.pathname.replace(/^\/(es|en|it|pt|fr|de|zh)/, "") || "";
          router.push(`/${idioma}${resto}`);
        }}
      >
        {IDIOMAS.map((idioma) => (
          <option key={idioma} value={idioma}>
            {etiquetaIdioma(idioma, actual)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RecordarIdioma() {
  useEffect(() => {
    const guardado = window.localStorage.getItem("audite.idioma");
    if (guardado && esIdioma(guardado) && !document.cookie.includes("audite.idioma=")) {
      document.cookie = `audite.idioma=${guardado}; Path=/; Max-Age=31536000; SameSite=Lax`;
    }
  }, []);
  return null;
}
