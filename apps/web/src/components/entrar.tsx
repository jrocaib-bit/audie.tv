"use client";

import { PROVEEDORES_ALTA, correoValido } from "@audite/domain";
import { useState } from "react";
import { borrarWeb, cerrarWeb, entrarCorreo, entrarOAuth } from "@/lib/auth-web";

const TEXTOS = {
  es: { titulo: "Entrar", apple: "Apple", google: "Google", correo: "Correo", enviar: "Enviar enlace", listo: "Listo", salir: "Salir", borrar: "Borrar cuenta" },
  en: { titulo: "Sign in", apple: "Apple", google: "Google", correo: "Email", enviar: "Send link", listo: "Done", salir: "Sign out", borrar: "Delete account" },
} as const;

export function Entrar({ lang }: { lang: string }) {
  const copy = lang === "en" ? TEXTOS.en : TEXTOS.es;
  const [correo, setCorreo] = useState("");
  const [estado, setEstado] = useState("");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center bg-[#100E0C] px-6 py-16 text-[#F4ECE2]">
      <p className="kicker text-[#C9A96E]">Audite</p>
      <h1 className="font-display mt-3 text-5xl">{copy.titulo}</h1>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {PROVEEDORES_ALTA.filter((item) => item !== "correo").map((item) => (
          <button key={item} type="button" className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#F4ECE2] text-[#100E0C]" onClick={() => void entrarOAuth(item).catch(() => setEstado(""))}>
            {item === "apple" ? copy.apple : copy.google}
          </button>
        ))}
      </div>
      <form
        className="mt-6 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!correoValido(correo)) return;
          void entrarCorreo(correo).then(() => setEstado(copy.listo)).catch(() => setEstado(""));
        }}
      >
        <input type="email" required value={correo} aria-label={copy.correo} placeholder={copy.correo} onChange={(event) => setCorreo(event.target.value)} className="min-h-12 rounded-full border border-[#F4ECE2]/30 bg-transparent px-4" />
        <button type="submit" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F4ECE2]/40">{copy.enviar}</button>
      </form>
      <div className="mt-8 flex gap-3">
        <button type="button" className="inline-flex min-h-11 items-center" onClick={() => void cerrarWeb()}>{copy.salir}</button>
        <button type="button" className="inline-flex min-h-11 items-center" onClick={() => void borrarWeb()}>{copy.borrar}</button>
      </div>
      {estado ? <p className="mt-4 text-sm text-[#C9A96E]">{estado}</p> : null}
    </main>
  );
}
