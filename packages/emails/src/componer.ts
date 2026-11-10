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
  const ayuda = id === "primer_cobro"
    ? "Si este cargo no te encaja, escribe a soporte@audite.tv. El reembolso de un pago de la tienda lo gestiona Apple o Google, en la tienda donde compraste."
    : undefined;
  const cta = `${base.cta}: ${base.ctaUrl}`;
  const secundario = base.ctaSecundario ? `${base.ctaSecundario.etiqueta}: ${base.ctaSecundario.url}` : "";
  return [base.cuerpo, cta, secundario, pie(base.tipo, datos, ayuda)].filter(Boolean).join("\n\n");
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
