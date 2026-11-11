import { render } from "@react-email/render";
import { createElement } from "react";
import { Carta } from "./carta";
import { borrador, pie, type DatosCorreo, type IdCorreo } from "./textos";

export type CorreoListo = {
  id: IdCorreo;
  tipo: "transactional" | "marketing";
  asuntoA: string;
  asuntoB: string;
  preheader: string;
  cta: string;
  ctaUrl: string;
  texto: string;
  html: string;
  headers: Record<string, string>;
};

export function textoCompleto(id: IdCorreo, datos: DatosCorreo): string {
  const base = borrador(id, datos);
  const cta = `${base.cta}: ${base.ctaUrl}`;
  const secundario = base.ctaSecundario ? `${base.ctaSecundario.etiqueta}: ${base.ctaSecundario.url}` : "";
  const pieTexto = id === "acuse_soporte"
    ? "—\nEste correo lo envía Audite desde no-reply@audite.tv.\nPara seguir el hilo, responde a este mensaje: llegará a soporte@audite.tv.\nhttps://audite.tv/contacto\nhttps://audite.tv/privacidad"
    : id === "confirmacion_boletin" || id === "confirmacion_lanzamiento"
      ? "—\nEste correo lo envía Audite desde no-reply@audite.tv y no admite respuesta.\nAyuda: soporte@audite.tv\nhttps://audite.tv/privacidad"
      : id === "bienvenida_lista"
        ? `—\nEste correo lo envía Audite desde no-reply@audite.tv y no admite respuesta.\nAyuda: soporte@audite.tv\nSi prefieres no recibir este tipo de correos: https://audite.tv/correo/baja?t=${datos.token ?? ""}\nhttps://audite.tv/privacidad`
        : pie(base.tipo, datos, id === "primer_cobro" ? "Si este cargo no te encaja, escribe a soporte@audite.tv. El reembolso de un pago de la tienda lo gestiona Apple o Google, en la tienda donde compraste." : undefined);
  return [base.cuerpo, cta, secundario, pieTexto].filter(Boolean).join("\n\n");
}

export async function componer(id: IdCorreo, datos: DatosCorreo = {}): Promise<CorreoListo> {
  const base = borrador(id, datos);
  const texto = textoCompleto(id, datos);
  const html = await render(createElement(Carta, { borrador: base, texto }));
  const headers: Record<string, string> = {};
  if (base.tipo === "marketing") {
    const baja = `https://audite.tv/correo/baja?t=${datos.token ?? ""}`;
    headers["List-Unsubscribe"] = `<${baja}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  return {
    id,
    tipo: base.tipo,
    asuntoA: base.asuntoA,
    asuntoB: base.asuntoB,
    preheader: base.preheader,
    cta: base.cta,
    ctaUrl: base.ctaUrl,
    texto,
    html,
    headers,
  };
}
