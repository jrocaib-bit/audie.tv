/** Lógica pura del relato con scroll de La sala (sin DOM): pose de cámara, bloque activo y opacidad. */

export type PasoCamara = { x: number; y: number; zoom: number };
export type Caja = { w: number; h: number };

/** Tope del zoom en móvil: el zoom crudo del paso (p. ej. 2.6) es excesivo en un visor estrecho. */
export const ZOOM_MAX_MOVIL = 1.8;

/** Zoom realmente aplicado: escritorio = el del paso; móvil = mitad del acercamiento, con tope, siempre ≥ 1. */
export function zoomAplicado(zoom: number, movil: boolean): number {
  const z = Math.max(1, zoom);
  return movil ? Math.min(ZOOM_MAX_MOVIL, 1 + (z - 1) * 0.5) : z;
}

/** Tamaño de la obra completa a «cover»: el lado menor llena la caja y el otro la desborda (se recorta con overflow). */
export function tamanoCover(aspecto: number | null, caja: Caja): Caja {
  const r = aspecto ?? caja.w / caja.h;
  const w = Math.max(caja.w, caja.h * r);
  return { w, h: w / r };
}

const limita = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Encuadre object-cover. El nodo que se transforma mide `ancho × alto` (la obra entera a tamaño cover, posiblemente
 * mayor que el visor); `translate + scale` (origin 0 0) centra el punto (x, y) con el zoom aplicado y la traslación
 * se limita a [caja − tamaño·zoom, 0] para que nunca asome el fondo: si no se puede centrar, gana el visor lleno.
 * Sin paso (apertura, cierre): cover centrado, zoom 1.
 */
export function poseNumerica(paso: PasoCamara | null, aspecto: number | null, caja: Caja, movil = false): { tx: number; ty: number; z: number; w: number; h: number } {
  const { w, h } = tamanoCover(aspecto, caja);
  const z = paso ? zoomAplicado(paso.zoom, movil) : 1;
  const x = paso ? paso.x : 0.5;
  const y = paso ? paso.y : 0.5;
  const tx = limita(caja.w / 2 - x * w * z, caja.w - w * z, 0);
  const ty = limita(caja.h / 2 - y * h * z, caja.h - h * z, 0);
  return { tx, ty, z, w, h };
}

export function transformaPaso(paso: PasoCamara | null, aspecto: number | null, caja: Caja, movil = false): { transform: string; transformOrigin: string; ancho: number; alto: number } {
  const { tx, ty, z, w, h } = poseNumerica(paso, aspecto, caja, movil);
  return { transform: `translate(${tx}px, ${ty}px) scale(${z})`, transformOrigin: "0 0", ancho: w, alto: h };
}

/** Bloques del relato: 0 = apertura, 1..n = pasos, n+1 = cierre. */
export type Bloque = { tipo: "apertura" } | { tipo: "paso"; n: number } | { tipo: "cierre" };

export function bloqueDe(indice: number, totalPasos: number): Bloque {
  if (indice <= 0) return { tipo: "apertura" };
  if (indice > totalPasos) return { tipo: "cierre" };
  return { tipo: "paso", n: indice };
}

/**
 * Bloque activo: el último cuyo TÍTULO ya ha entrado en la franja de texto, es decir, cuyo top está en o por encima de
 * la línea de foco (cerca del borde superior de la columna de texto). Así un paso no coexiste con el texto del siguiente.
 * Sin títulos o ninguno alcanzado → 0 (apertura).
 */
export function indiceActivo(topsTitulo: readonly number[], linea: number): number {
  let activo = 0;
  topsTitulo.forEach((t, i) => {
    if (t <= linea) activo = i;
  });
  return activo;
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

/**
 * Opacidad de un bloque. Un bloque nunca queda a media tinta mientras se puede leer: activo o ya revelado = 1.
 * Escritorio: solo el fundido de entrada (sin revelar 0). Móvil y movimiento reducido: siempre 1 (sin fundidos).
 * El foco (qué paso está activo) lo marcan la cámara y la máscara, no la opacidad del texto.
 */
export function opacidadBloque(estado: { revelado: boolean; activo: boolean }, reducido: boolean, movil = false): number {
  if (reducido || movil) return 1;
  return estado.activo || estado.revelado ? 1 : 0;
}
