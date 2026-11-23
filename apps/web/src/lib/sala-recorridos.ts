import "server-only";
/** Recorridos narrativos de La sala. SOLO servidor: nunca importar desde código cliente. */
import datos from "@/datos/recorridos-sala.json";
import type { Adelanto, RecorridoSala, RecorridoVista } from "./sala-cuenta";

const RECORRIDOS = datos as Record<string, RecorridoSala>;

export function idsSala(): string[] {
  return Object.keys(RECORRIDOS);
}

export function recorridoSala(id: string): RecorridoSala | null {
  return Object.prototype.hasOwnProperty.call(RECORRIDOS, id) ? RECORRIDOS[id]! : null;
}

export function resolverRecorrido(id: string, lang: "es" | "en"): RecorridoVista | null {
  const r = recorridoSala(id);
  if (!r) return null;
  return {
    apertura: { titulo: r.apertura.titulo[lang], texto: r.apertura.texto[lang] },
    pasos: r.pasos.map((p) => ({ x: p.x, y: p.y, zoom: p.zoom, titulo: p.titulo[lang], texto: p.texto[lang] })),
    cierre: { titulo: r.cierre.titulo[lang], texto: r.cierre.texto[lang] },
  };
}

/** Adelanto público: SOLO la apertura. Nunca pasos ni cierre. */
export function adelantoSala(id: string, lang: "es" | "en"): Adelanto | null {
  const r = recorridoSala(id);
  return r ? { titulo: r.apertura.titulo[lang], texto: r.apertura.texto[lang] } : null;
}
