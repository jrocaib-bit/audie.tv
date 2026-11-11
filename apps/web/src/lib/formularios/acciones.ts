"use server";

import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { avisoBloqueo, decisionEnvio, enviarCorreo } from "@audite/emails";
import { esquemaLanzamiento, esquemaLista, esquemaSoporte, textoErrorLista, textoErrorSoporte } from "./esquemas";
import { POLITICA_VERSION, MENSAJE_BAJA_ERROR, MENSAJE_CONTACTO_OK, MENSAJE_CONTACTO_RED, MENSAJE_RED, correoNormalizado, crearToken, debeEnviarCorreo, esTokenUuid, filtrosLimite, firmarMarca, hashSecreto, mensajeLista, puedeContarLimite, resolverBaja, type ListaCorreo } from "./logica";

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

async function consumirUno(cliente: NonNullable<ReturnType<typeof admin>>, pedido: { clave: string; periodo: "hora" | "dia"; inicio: number; tope: number }): Promise<boolean> {
  const inicio = new Date(pedido.inicio).toISOString();
  const { data, error } = await cliente.rpc("consumir_limite", {
    p_clave: pedido.clave,
    p_periodo: pedido.periodo,
    p_inicio: inicio,
    p_tope: pedido.tope,
  });
  if (!error) return data === true;
  if (!/consumir_limite|PGRST202|42883/i.test(String(error.message ?? ""))) return false;
  const lectura = await cliente.from("limites_envio").select("cuenta").eq("clave", pedido.clave).eq("periodo", pedido.periodo).eq("inicio", inicio).maybeSingle();
  if (lectura.error) return false;
  const cuenta = Number(lectura.data?.cuenta ?? 0);
  if (cuenta >= pedido.tope) return false;
  const escritura = await cliente.from("limites_envio").upsert({
    clave: pedido.clave,
    periodo: pedido.periodo,
    inicio,
    cuenta: cuenta + 1,
  }, { onConflict: "clave,periodo,inicio" });
  return !escritura.error;
}

async function permitido(email: string, ip: string): Promise<boolean> {
  const cliente = admin();
  if (!cliente) return true;
  for (const pedido of filtrosLimite(ip, email, Date.now())) {
    if (!await consumirUno(cliente, pedido)) return false;
  }
  return true;
}

function saleA(destinatarios: string[]): boolean {
  return decisionEnvio({
    envioReal: debeEnviarCorreo(),
    permitidos: process.env.CORREO_DESTINOS_PERMITIDOS,
    produccion: process.env.VERCEL_ENV === "production",
    destinatarios: { to: destinatarios },
  }) === "enviar";
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
  const parsed = esquemaSoporte.safeParse({
    nombre: String(datos.get("nombre") ?? ""),
    correo: String(datos.get("correo") ?? datos.get("email") ?? ""),
    mensaje: String(datos.get("mensaje") ?? ""),
    privacidad: String(datos.get("privacidad") ?? ""),
  });
  const sal = process.env.IP_HASH_SALT?.trim() || "sin-sal";
  const ahora = Date.now();
  if (miel.trim()) return { estado: "ok", texto: MENSAJE_CONTACTO_OK, cuenta: false };
  if (!parsed.success) return { estado: "error", texto: textoErrorSoporte(parsed.error), cuenta: false };
  if (!puedeContarLimite({ miel, firma, sal, ahora, valido: true })) {
    return { estado: "ok", texto: MENSAJE_CONTACTO_OK, cuenta: false };
  }
  const nombre = parsed.data.nombre;
  const email = correoNormalizado(parsed.data.correo);
  const mensaje = parsed.data.mensaje;
  const ip = await ipHash();
  if (!await permitido(email, ip)) return { estado: "error", texto: MENSAJE_CONTACTO_RED, cuenta: false };
  const cliente = admin();
  if (cliente) {
    await cliente.from("mensajes_soporte").insert({ nombre, email, asunto: "Consulta", mensaje, ip_hash: ip });
  }
  const destino = process.env.SOPORTE_DESTINO?.trim();
  if (destino && debeEnviarCorreo()) {
    if (!saleA([destino])) {
      console.info(avisoBloqueo("soporte"));
    } else {
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
  const esquema = lista === "boletin" ? esquemaLista : esquemaLanzamiento;
  const parsed = esquema.safeParse({
    correo: String(datos.get("correo") ?? datos.get("email") ?? ""),
    privacidad: String(datos.get("privacidad") ?? ""),
    plataforma: String(datos.get("plataforma") ?? ""),
  });
  const sal = process.env.IP_HASH_SALT?.trim() || "sin-sal";
  const ahora = Date.now();
  const texto = mensajeLista(saleA([correoNormalizado(String(datos.get("correo") ?? datos.get("email") ?? ""))]));
  if (miel.trim()) return { estado: "ok", texto, cuenta: false };
  if (!parsed.success) return { estado: "error", texto: textoErrorLista(parsed.error), cuenta: false };
  if (!puedeContarLimite({ miel, firma, sal, ahora, valido: true })) {
    return { estado: "ok", texto, cuenta: false };
  }
  const email = correoNormalizado(parsed.data.correo);
  const plataforma = "plataforma" in parsed.data ? parsed.data.plataforma : "";
  const ip = await ipHash();
  if (!await permitido(email, ip)) return { estado: "error", texto: MENSAJE_RED, cuenta: false };
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
  return { estado: "ok", texto, cuenta: true };
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

export async function bajaLista(token: string): Promise<"ok" | "invalido" | "error"> {
  if (!token) return "invalido";
  const sal = process.env.IP_HASH_SALT?.trim() || "sin-sal";
  const cliente = admin();
  if (!cliente) return "error";
  const lista = await cliente.from("suscripciones_correo").update({
    estado: "baja",
    unsubscribed_at: new Date().toISOString(),
  }).eq("token_hash", hashSecreto(token, sal)).select("id");
  let filasPreferencia = 0;
  let error = lista.error?.message ?? null;
  if (!error && esTokenUuid(token)) {
    const preferencia = await cliente.from("email_preferencias").update({
      marketing_consent: false,
      unsubscribed_at: new Date().toISOString(),
    }).eq("token", token).select("user_id");
    if (preferencia.error) error = preferencia.error.message;
    else filasPreferencia = preferencia.data?.length ?? 0;
  }
  const resultado = resolverBaja({ filasLista: lista.data?.length ?? 0, filasPreferencia, error });
  if (resultado === "error") console.error(JSON.stringify({ baja: MENSAJE_BAJA_ERROR, error }));
  return resultado;
}

