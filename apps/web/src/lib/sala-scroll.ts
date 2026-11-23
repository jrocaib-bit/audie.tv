/** Lógica pura del relato con scroll de La sala (sin DOM): pose de cámara, bloque activo y opacidad. */

export type PasoCamara = { x: number; y: number; zoom: number };
export type Caja = { w: number; h: number };

/**
 * Transformación que centra el punto (x, y) normalizado de la obra y la acerca `zoom` veces
 * (translate + scale, origin 0 0). Sin paso: cuadro entero (`none`). La obra va con object-contain:
 * se calcula su rectángulo dentro de la caja.
 */
export function transformaPaso(paso: PasoCamara | null, aspecto: number | null, caja: Caja): { transform: string; transformOrigin: string } {
  if (!paso) return { transform: "none", transformOrigin: "0 0" };
  const r = aspecto ?? caja.w / caja.h;
  const w = Math.min(caja.w, caja.h * r);
  const h = w / r;
  const px = (caja.w - w) / 2 + paso.x * w;
  const py = (caja.h - h) / 2 + paso.y * h;
  const tx = caja.w / 2 - px * paso.zoom;
  const ty = caja.h / 2 - py * paso.zoom;
  return { transform: `translate(${tx}px, ${ty}px) scale(${paso.zoom})`, transformOrigin: "0 0" };
}

/** Bloques del relato: 0 = apertura, 1..n = pasos, n+1 = cierre. */
export type Bloque = { tipo: "apertura" } | { tipo: "paso"; n: number } | { tipo: "cierre" };

export function bloqueDe(indice: number, totalPasos: number): Bloque {
  if (indice <= 0) return { tipo: "apertura" };
  if (indice > totalPasos) return { tipo: "cierre" };
  return { tipo: "paso", n: indice };
}

/** Bloque activo: el que tiene su centro más cerca de la línea de foco. Vacío → 0. */
export function indiceActivo(centros: readonly number[], linea: number): number {
  let mejor = 0;
  let dist = Infinity;
  centros.forEach((c, i) => {
    const d = Math.abs(c - linea);
    if (d < dist) {
      dist = d;
      mejor = i;
    }
  });
  return mejor;
}

/** Cámara de un bloque activo: paso n → su pose; apertura y cierre → cuadro entero (null). */
export function poseDeBloque<T extends PasoCamara>(indice: number, pasos: readonly T[]): T | null {
  const b = bloqueDe(indice, pasos.length);
  return b.tipo === "paso" ? (pasos[b.n - 1] ?? null) : null;
}

export function etiquetaCamara(indice: number, totalPasos: number): string {
  const b = bloqueDe(indice, totalPasos);
  return b.tipo === "paso" ? `paso-${b.n}` : "entera";
}

export function etiquetaActivo(indice: number, totalPasos: number): string {
  const b = bloqueDe(indice, totalPasos);
  return b.tipo === "paso" ? String(b.n) : b.tipo;
}

/** Opacidad de un bloque: sin revelar 0; activo 1; ya leído 0.55; con movimiento reducido siempre 1. */
export function opacidadBloque(estado: { revelado: boolean; activo: boolean }, reducido: boolean): number {
  if (reducido) return 1;
  if (estado.activo) return 1;
  return estado.revelado ? 0.55 : 0;
}
