"use client";

import { RETOS } from "@/lib/retos";

export { RETOS };

type Guardado = Record<string, { hechos: number[]; fechas: string[] }>;

const CLAVE = "audite.retos.v1";
const vacio: Guardado = {};
let cache: Guardado = vacio;
let leido = false;
const oyentes = new Set<() => void>();

export function leerRetos(): Guardado {
  if (!leido && typeof localStorage !== "undefined") {
    leido = true;
    try {
      const valor = JSON.parse(localStorage.getItem(CLAVE) || "{}") as Guardado;
      cache = valor && typeof valor === "object" ? valor : vacio;
    } catch {
      cache = vacio;
    }
  }
  return cache;
}

export function suscribirRetos(avisar: () => void): () => void {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}

export function marcarDia(id: string, dia: number, hoy: string) {
  const actual = leerRetos()[id] ?? { hechos: [], fechas: [] };
  const tiene = actual.hechos.includes(dia);
  const hechos = tiene ? actual.hechos.filter((item) => item !== dia) : [...actual.hechos, dia];
  const fechas = tiene ? actual.fechas.filter((item) => item !== hoy) : [...new Set([...actual.fechas, hoy])];
  cache = { ...leerRetos(), [id]: { hechos, fechas } };
  localStorage.setItem(CLAVE, JSON.stringify(cache));
  oyentes.forEach((oyente) => oyente());
}
