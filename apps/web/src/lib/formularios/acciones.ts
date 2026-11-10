"use server";

import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { enviarCorreo } from "@audite/emails";
import { POLITICA_VERSION, MENSAJE_CONTACTO_CORREO, MENSAJE_CONTACTO_OK, MENSAJE_CONTACTO_RED, MENSAJE_CONTACTO_VACIO, MENSAJE_CORREO, MENSAJE_LISTA, MENSAJE_RED, consumirLimite, correoNormalizado, correoValido, crearToken, debeEnviarCorreo, decidirEnvio, firmarMarca, hashSecreto, type ListaCorreo } from "./logica";

export async function marcaFormulario(): Promise<string> {
  return firmarMarca(Date.now(), process.env.IP_HASH_SALT?.trim() || "sin-sal");
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !clave) return null;
  return createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function ipHash(): Promise<string> {
  const sal = process.env.IP_HASH_SALT?.trim() || "sin-sal";
  const cabeza = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "0";
  return hashSecreto(cabeza, sal);
}

async function permitido(email: string, ip: string): Promise<boolean> {
  const cliente = admin();
  if (!cliente) return true;
  const { data } = await cliente.from("limites_envio").select("clave, periodo, inicio, cuenta");
  const ventanas = ((data ?? []) as { clave: string; periodo: "hora" | "dia"; inicio: string; cuenta: number }[]).map((item) => ({
    clave: item.clave,
    periodo: item.periodo,
    inicio: Date.parse(item.inicio),
    cuenta: item.cuenta,
  }));
  const paso = consumirLimite(ventanas, ip, email, Date.now());
  if (!paso.permitido) return false;
  for (const ventana of paso.ventanas) {
    await cliente.from("limites_envio").upsert({
      clave: ventana.clave,
      periodo: ventana.periodo,
      inicio: new Date(ventana.inicio).toISOString(),
      cuenta: ventana.cuenta,
    });
  }
  return true;
}

async function enviar(id: "confirmacion_boletin" | "confirmacion_lanzamiento" | "bienvenida_lista" | "acuse_soporte", to: string, datos: { token?: string; nombre?: string; correo?: string } = {}) {
  if (!debeEnviarCorreo()) {
    console.info(JSON.stringify({ correo: id, to, simulado: true }));
    return;
  }
  await enviarCorreo({
    id,
    to,
    preferencia: id === "bienvenida_lista" ? { marketing_consent: true, unsubscribed_at: null } : null,
    datos,
  });
}

export async function enviarSoporte(datos: FormData): Promise<{ estado: "ok" | "error"; texto: string; cuenta: boolean }> {
  const miel = String(datos.get("compania") ?? "");
  const firma = String(datos.get("marca") ?? "");
  const nombre = String(datos.get("nombre") ?? "").trim();
  const email = correoNormalizado(String(datos.get("correo") ?? datos.get("email") ?? ""));
  const mensaje = String(datos.get("mensaje") ?? "").trim();
  const privacidad = datos.get("privacidad") === "on";
  const sal = process.env.IP_HASH_SALT?.trim() || "sin-sal";
  const valido = nombre.length > 1 && nombre.length < 80 && correoValido(email) && mensaje.length > 3 && mensaje.length < 4000 && privacidad;
  const ip = await ipHash();
  const cabe = await permitido(email, ip);
  const decision = decidirEnvio({ miel, firma, sal, ahora: Date.now(), permitido: cabe, valido });
  if (decision === "descartado") return { estado: "ok", texto: MENSAJE_CONTACTO_OK, cuenta: false };
  if (decision !== "aceptado") {
    const vacio = mensaje.length < 2;
    return { estado: "error", texto: decision === "limite" ? MENSAJE_CONTACTO_RED : vacio ? MENSAJE_CONTACTO_VACIO : !correoValido(email) ? MENSAJE_CONTACTO_CORREO : MENSAJE_CONTACTO_RED, cuenta: false };
  }
  const cliente = admin();
  if (cliente) {
    await cliente.from("mensajes_soporte").insert({ nombre, email, asunto: "Consulta", mensaje, ip_hash: ip });
  }
  const destino = process.env.SOPORTE_DESTINO?.trim();
  if (destino && debeEnviarCorreo()) {
    const { Resend } = await import("resend");
    const clave = process.env.RESEND_API_KEY?.trim();
    if (clave) {
      await new Resend(clave).emails.send({
        from: "Audite <no-reply@audite.tv>",
        to: destino,
        replyTo: email,
        subject: "Consulta",
        text: `${nombre}\n${email}\n\n${mensaje}`,
      });
    }
  } else {
    console.info(JSON.stringify({ correo: "soporte", to: destino ?? "", simulado: true }));
  }
  if (process.env.SOPORTE_ACUSE === "true") await enviar("acuse_soporte", email, { nombre, correo: email });
  return { estado: "ok", texto: MENSAJE_CONTACTO_OK, cuenta: true };
}

async function altaLista(datos: FormData, lista: ListaCorreo): Promise<{ estado: "ok" | "error"; texto: string; cuenta: boolean }> {
  const miel = String(datos.get("compania") ?? "");
  const firma = String(datos.get("marca") ?? "");
  const email = correoNormalizado(String(datos.get("correo") ?? datos.get("email") ?? ""));
  const plataforma = String(datos.get("plataforma") ?? "");
  const privacidad = datos.get("privacidad") === "on";
  const sal = process.env.IP_HASH_SALT?.trim() || "sin-sal";
  const plataformaOk = lista === "boletin" || plataforma === "ios" || plataforma === "android" || plataforma === "ambas";
  const valido = correoValido(email) && privacidad && plataformaOk;
  const ip = await ipHash();
  const cabe = await permitido(email, ip);
  const decision = decidirEnvio({ miel, firma, sal, ahora: Date.now(), permitido: cabe, valido });
  if (decision === "descartado") return { estado: "ok", texto: MENSAJE_LISTA, cuenta: false };
  if (decision !== "aceptado") return { estado: "error", texto: decision === "limite" ? MENSAJE_RED : MENSAJE_CORREO, cuenta: false };
  const token = crearToken(Date.now(), sal);
  const cliente = admin();
  if (cliente) {
    const { data } = await cliente.from("suscripciones_correo").select("email, lista, estado").eq("email", email).eq("lista", lista).maybeSingle();
    if (data?.estado !== "confirmada") {
      await cliente.from("suscripciones_correo").upsert({
        email,
        lista,
        plataforma: lista === "lanzamiento_app" ? plataforma : null,
        estado: "pendiente",
        token_hash: token.hash,
        expira: new Date(token.expira).toISOString(),
        ip_hash: ip,
        politica: POLITICA_VERSION,
      }, { onConflict: "email,lista" });
      await enviar(lista === "boletin" ? "confirmacion_boletin" : "confirmacion_lanzamiento", email, { token: token.token, correo: email });
    }
  }
  return { estado: "ok", texto: MENSAJE_LISTA, cuenta: true };
}

export async function enviarBoletin(datos: FormData) {
  return altaLista(datos, "boletin");
}

export async function enviarLanzamiento(datos: FormData) {
  return altaLista(datos, "lanzamiento_app");
}

export async function confirmarLista(token: string): Promise<"ok" | "caducado"> {
  const sal = process.env.IP_HASH_SALT?.trim() || "sin-sal";
  const cliente = admin();
  if (!cliente || !token) return "caducado";
  const hash = hashSecreto(token, sal);
  const { data } = await cliente.from("suscripciones_correo").select("id, estado, expira").eq("token_hash", hash).maybeSingle();
  if (!data) return "caducado";
  if (data.estado === "confirmada") return "ok";
  if (Date.parse(data.expira) < Date.now()) return "caducado";
  const ip = await ipHash();
  await cliente.from("suscripciones_correo").update({
    estado: "confirmada",
    confirmed_at: new Date().toISOString(),
    consent_at: new Date().toISOString(),
    ip_hash: ip,
    politica: POLITICA_VERSION,
  }).eq("id", data.id);
  const { data: fila } = await cliente.from("suscripciones_correo").select("email").eq("id", data.id).maybeSingle();
  if (fila?.email) await enviar("bienvenida_lista", fila.email, { token, correo: fila.email });
  return "ok";
}

export async function bajaLista(token: string): Promise<void> {
  const sal = process.env.IP_HASH_SALT?.trim() || "sin-sal";
  const cliente = admin();
  if (!cliente || !token) return;
  await cliente.from("suscripciones_correo").update({
    estado: "baja",
    unsubscribed_at: new Date().toISOString(),
  }).eq("token_hash", hashSecreto(token, sal));
}

