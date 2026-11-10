import { z } from "zod";
import { MENSAJE_CONTACTO_CORREO, MENSAJE_CONTACTO_RED, MENSAJE_CONTACTO_VACIO, MENSAJE_CORREO, MENSAJE_RED } from "./logica";

const correo = z.string().trim().email().max(200);
const privacidad = z.literal("on");

export const esquemaSoporte = z.object({
  nombre: z.string().trim().min(2).max(80),
  correo,
  mensaje: z.string().trim().min(2).max(4000),
  privacidad,
});

export const esquemaLista = z.object({
  correo,
  privacidad,
});

export const esquemaLanzamiento = esquemaLista.extend({
  plataforma: z.enum(["ios", "android", "ambas"]),
});

export function textoErrorSoporte(error: z.ZodError): string {
  const campos = error.issues.map((issue) => String(issue.path[0] ?? ""));
  if (campos.includes("correo")) return MENSAJE_CONTACTO_CORREO;
  if (campos.includes("mensaje") || campos.includes("nombre")) return MENSAJE_CONTACTO_VACIO;
  return MENSAJE_CONTACTO_RED;
}

export function textoErrorLista(error: z.ZodError): string {
  const campos = error.issues.map((issue) => String(issue.path[0] ?? ""));
  if (campos.includes("correo")) return MENSAJE_CORREO;
  return MENSAJE_RED;
}
