import { Resend } from "resend";
import { REMITENTE, RESPUESTA, type IdCorreo } from "./textos";
import { componer, type CorreoListo } from "./componer";
import type { DatosCorreo } from "./textos";
import { avisoBloqueo, decisionEnvio } from "./destinos";

export type PreferenciaCorreo = {
  marketing_consent: boolean;
  unsubscribed_at: string | null;
};

export function puedeEnviarMarketing(preferencia: PreferenciaCorreo | null): boolean {
  return preferencia?.marketing_consent === true && preferencia.unsubscribed_at == null;
}

export type PayloadCorreo = {
  from: string;
  replyTo: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

export async function enviarCorreo(opciones: {
  id: IdCorreo;
  datos?: DatosCorreo;
  variante?: "A" | "B";
  to: string;
  preferencia: PreferenciaCorreo | null;
  correo?: CorreoListo;
  enviar?: (payload: PayloadCorreo) => Promise<void>;
}): Promise<"omitido" | "sin-clave" | "listo"> {
  const correo = opciones.correo ?? await componer(opciones.id, opciones.datos ?? {});
  if (correo.tipo === "marketing" && !puedeEnviarMarketing(opciones.preferencia)) return "omitido";
  if (decisionEnvio({
    envioReal: process.env.CORREO_ENVIO_REAL === "true",
    permitidos: process.env.CORREO_DESTINOS_PERMITIDOS,
    produccion: process.env.VERCEL_ENV === "production",
    destinatarios: { to: opciones.to },
  }) === "bloqueado") {
    console.info(avisoBloqueo(opciones.id));
    return "omitido";
  }
  const payload: PayloadCorreo = {
    from: REMITENTE,
    replyTo: RESPUESTA,
    to: opciones.to,
    subject: opciones.variante === "B" ? correo.asuntoB : correo.asuntoA,
    html: correo.html,
    text: correo.texto,
    headers: correo.headers,
  };
  if (opciones.enviar) {
    await opciones.enviar(payload);
    return "listo";
  }
  const clave = process.env.RESEND_API_KEY?.trim();
  if (!clave) return "sin-clave";
  const resend = new Resend(clave);
  await resend.emails.send({
    from: payload.from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    replyTo: payload.replyTo,
    headers: payload.headers,
  });
  return "listo";
}
