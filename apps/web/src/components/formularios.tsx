"use client";

import { useState } from "react";
import Link from "next/link";
import { enviarBoletin, enviarLanzamiento, enviarSoporte } from "@/lib/formularios/acciones";
import { medir } from "@/lib/medicion";

const campo = "h-12 w-full rounded-xl border border-[#2E2924] bg-transparent px-3 text-[#F4ECE2]";

function Aviso({ estado, texto }: { estado: "ok" | "error" | "idle"; texto: string }) {
  if (estado === "idle") return null;
  return <p className={estado === "ok" ? "text-[#C9A96E]" : "text-[#E7D7C3]"}>{texto}</p>;
}

function Miel({ marca }: { marca: string }) {
  return (
    <>
      <input type="text" name="compania" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <input type="hidden" name="marca" value={marca} />
    </>
  );
}

function Privacidad() {
  return (
    <label className="flex min-h-11 items-center gap-3 text-sm text-[#B7AB9C]">
      <input type="checkbox" name="privacidad" required />
      <span>Acepto la <Link className="underline" href="/privacidad">privacidad</Link>.</span>
    </label>
  );
}

export function FormularioSoporte({ marca, idioma, ubicacion = "contacto" }: { marca: string; idioma: string; ubicacion?: string }) {
  const [estado, setEstado] = useState<"ok" | "error" | "idle">("idle");
  const [texto, setTexto] = useState("");
  return (
    <form className="relative mt-8 grid gap-3" action={async (datos) => {
      medir("cta_clicked", { form_id: "soporte", cta_id: "soporte_enviar", ubicacion, idioma, plataforma: "web" });
      const respuesta = await enviarSoporte(datos);
      if (respuesta.cuenta) medir("form_submitted", { form_id: "soporte", cta_id: "soporte_enviar", ubicacion, idioma, plataforma: "web" });
      setEstado(respuesta.estado);
      setTexto(respuesta.texto);
    }}>
      <Miel marca={marca} />
      <input className={campo} name="nombre" required aria-label="Nombre" placeholder="Nombre" />
      <input className={campo} name="correo" type="email" required aria-label="Correo" placeholder="Correo" />
      <textarea className={`${campo} h-32 py-3`} name="mensaje" required minLength={2} aria-label="Mensaje" placeholder="Mensaje" />
      <Privacidad />
      <button className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]" type="submit">Enviar</button>
      {estado === "ok" ? (
        <p className="text-[#C9A96E]">Gracias, hemos recibido tu mensaje. Te responderemos a tu correo en menos de 48 horas laborables. Mientras tanto, puedes consultar la <Link className="underline" href="/ayuda">ayuda</Link>.</p>
      ) : <Aviso estado={estado} texto={texto} />}
    </form>
  );
}

export function FormularioBoletin({ marca, idioma }: { marca: string; idioma: string }) {
  const [estado, setEstado] = useState<"ok" | "error" | "idle">("idle");
  const [texto, setTexto] = useState("");
  return (
    <form className="relative grid gap-3" action={async (datos) => {
      medir("cta_clicked", { form_id: "lista_correo", cta_id: "lista_enviar", ubicacion: "pie", idioma, plataforma: "web", opt_in_correo: true });
      const respuesta = await enviarBoletin(datos);
      if (respuesta.cuenta) medir("form_submitted", { form_id: "lista_correo", cta_id: "lista_enviar", ubicacion: "pie", idioma, plataforma: "web", opt_in_correo: true });
      setEstado(respuesta.estado);
      setTexto(respuesta.texto);
    }}>
      <Miel marca={marca} />
      <input className={campo} name="correo" type="email" required aria-label="Correo" placeholder="Correo" />
      <Privacidad />
      <button className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]" type="submit">Recibir novedades</button>
      <Aviso estado={estado} texto={texto} />
    </form>
  );
}

export function FormularioLanzamiento({ marca, idioma }: { marca: string; idioma: string }) {
  const [estado, setEstado] = useState<"ok" | "error" | "idle">("idle");
  const [texto, setTexto] = useState("");
  return (
    <form id="aviso" className="relative grid gap-3" action={async (datos) => {
      medir("cta_clicked", { form_id: "avisame_app", cta_id: "avisame_enviar", ubicacion: "app", idioma, plataforma: "web", opt_in_correo: true });
      const respuesta = await enviarLanzamiento(datos);
      if (respuesta.cuenta) medir("form_submitted", { form_id: "avisame_app", cta_id: "avisame_enviar", ubicacion: "app", idioma, plataforma: "web", opt_in_correo: true });
      setEstado(respuesta.estado);
      setTexto(respuesta.texto);
    }}>
      <Miel marca={marca} />
      <p className="text-sm text-[#C9A96E]">Próximamente</p>
      <input className={campo} name="correo" type="email" required aria-label="Correo" placeholder="Correo" />
      <select className={campo} name="plataforma" aria-label="Plataforma" defaultValue="ambas">
        <option value="ios">iOS</option>
        <option value="android">Android</option>
        <option value="ambas">iOS y Android</option>
      </select>
      <Privacidad />
      <button className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]" type="submit">Avísame cuando salga</button>
      <Aviso estado={estado} texto={texto} />
    </form>
  );
}

