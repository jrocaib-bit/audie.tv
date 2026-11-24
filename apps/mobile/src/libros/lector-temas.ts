/** Temas del lector (Día, Sepia, Noche) y acento del color del libro con contraste suficiente. Sin React Native. */
import { contraste, luminancia } from "@audite/domain";
import type { TemaLector } from "./ajustes";

export type ColoresLector = {
  bg: string;
  ink: string;
  muted: string;
  card: string;
  line: string;
  /** Texto atenuado de apoyo (título pequeño, número de página): 4,5:1 sobre `bg`. */
  tenue: string;
  barra: string;
  oscuro: boolean;
};

export const TEMAS_LECTOR: Record<TemaLector, ColoresLector> = {
  dia: { bg: "#FBF8F2", ink: "#1B1814", muted: "#5B534A", card: "#F1EBE0", line: "#DDD3C3", tenue: "#6B6258", barra: "rgba(251,248,242,0.94)", oscuro: false },
  sepia: { bg: "#F1E6CF", ink: "#3A2D1D", muted: "#6A5640", card: "#E8DABD", line: "#D3C29F", tenue: "#6A5640", barra: "rgba(241,230,207,0.94)", oscuro: false },
  noche: { bg: "#100E0C", ink: "#E9E0D3", muted: "#B7AB9C", card: "#1B1815", line: "#2E2924", tenue: "#A89C8D", barra: "rgba(16,14,12,0.94)", oscuro: true },
};

export const ROTULO_TEMA: Record<TemaLector, string> = { dia: "Día", sepia: "Sepia", noche: "Noche" };
export const TEMAS_ORDEN: TemaLector[] = ["dia", "sepia", "noche"];

const CONTRASTE_MINIMO = 4.5;

function aHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mezcla(hex: string, con: string, t: number): string {
  const a = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(con.slice(i, i + 2), 16));
  return aHex(a[0]! + (b[0]! - a[0]!) * t, a[1]! + (b[1]! - a[1]!) * t, a[2]! + (b[2]! - a[2]!) * t);
}

/**
 * Acento del libro para el lector: el color propio del volumen, acercado a la tinta del tema
 * hasta que cumple 4,5:1 sobre el fondo. Si el color ya cumple, queda exacto.
 */
export function acentoLector(colorLibro: string, tema: ColoresLector): string {
  const base = /^#[0-9a-fA-F]{6}$/.test(colorLibro) ? colorLibro : "#8A6432";
  if (Number.isNaN(luminancia(base))) return tema.ink;
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const candidato = mezcla(base, tema.ink, t);
    if (contraste(candidato, tema.bg) >= CONTRASTE_MINIMO) return candidato;
  }
  return tema.ink;
}

/** Tinta legible sobre el acento (botones rellenos). */
export function tintaSobreAcento(acento: string): string {
  return contraste("#FFFFFF", acento) >= contraste("#100E0C", acento) ? "#FFFFFF" : "#100E0C";
}

export const TAMANOS_LECTOR = [16, 18, 20, 23] as const;
