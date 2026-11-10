"use client";

import { esIdioma, textosAlta } from "@audite/domain";
import { obraDeEpisodio } from "@audite/content/obras";
import Link from "next/link";
import { useState } from "react";
import { Wordmark } from "@/components/brand";
import { BotonApple, BotonGoogle } from "@/components/botones-alta";
import { ObraFoto } from "@/components/placa";
import { entrarCorreo, entrarOAuth } from "@/lib/auth-web";
import { medir } from "@/lib/medicion";
import { correoValido } from "@audite/domain";

export function Entrar({ lang }: { lang: string }) {
  const copy = textosAlta(lang);
  const ui = esIdioma(lang) ? lang : "es";
  const obra = obraDeEpisodio("gn-01");
  const [correo, setCorreo] = useState("");
  const [estado, setEstado] = useState("");
  const [marketing, setMarketing] = useState(false);

  return (
    <main className="relative min-h-dvh bg-[#100E0C] text-[#F4ECE2]">
      <div className="absolute inset-x-0 top-0 h-[52svh] overflow-hidden">
        {obra ? <ObraFoto obra={obra} priority className="h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-b from-[#100E0C]/25 via-[#100E0C]/55 to-[#100E0C]" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-16 pb-8">
        <Wordmark locale={ui} tono="blanco" className="h-8 w-auto" />
        <h1 className="font-display mt-8 max-w-sm text-5xl leading-[0.95]">{copy.titulo}</h1>
        <div className="mt-auto grid gap-3 pt-16">
          <label className="flex min-h-11 items-center gap-3 text-sm text-[#B7AB9C]">
            <input type="checkbox" checked={marketing} onChange={(event) => { setMarketing(event.target.checked); localStorage.setItem("audite.marketing.v1", event.target.checked ? "1" : "0"); }} />
            Recibir correos de Audite
          </label>
          <BotonApple etiqueta={copy.apple} onClick={() => { localStorage.setItem("audite.marketing.v1", marketing ? "1" : "0"); medir("signup_started", { proveedor: "apple" }); void entrarOAuth("apple").catch(() => setEstado("")); }} />
          <BotonGoogle etiqueta={copy.google} onClick={() => { medir("signup_started", { proveedor: "google" }); void entrarOAuth("google").catch(() => setEstado("")); }} />
          <div className="flex items-center gap-3 py-1 text-sm text-[#B7AB9C]">
            <span className="h-px flex-1 bg-[#F4ECE2]/25" />
            {copy.o}
            <span className="h-px flex-1 bg-[#F4ECE2]/25" />
          </div>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!correoValido(correo)) return;
              localStorage.setItem("audite.marketing.v1", marketing ? "1" : "0");
              medir("signup_started", { proveedor: "correo" });
              void entrarCorreo(correo).then(() => setEstado(copy.listo)).catch(() => setEstado(""));
            }}
          >
            <input
              type="email"
              required
              value={correo}
              aria-label={copy.correo}
              placeholder={copy.correo}
              onChange={(event) => setCorreo(event.target.value)}
              className="h-12 rounded-[6px] border border-[#F4ECE2]/30 bg-transparent px-4"
            />
            <button type="submit" className="inline-flex h-12 items-center justify-center rounded-[6px] border border-[#F4ECE2]/40">
              {copy.enviar}
            </button>
          </form>
          {estado ? <p className="text-center text-sm text-[#C9A96E]">{estado}</p> : null}
          <p className="mt-2 flex justify-center gap-4 text-xs text-[#B7AB9C]">
            <Link href={`/${lang}/condiciones`} className="inline-flex min-h-11 items-center">{copy.condiciones}</Link>
            <Link href={`/${lang}/privacidad`} className="inline-flex min-h-11 items-center">{copy.privacidad}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
