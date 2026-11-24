/** Iluminación por zona de La sala (lógica pura, sin DOM): dónde cae el foco y qué radio tiene en el visor. */
import { poseNumerica, zoomAplicado, type Caja, type PasoCamara } from "./sala-scroll";

export const RADIO_MIN = 0.14;
export const RADIO_MAX = 0.36;
/** Oscuridad de la máscara fuera del foco (0 = transparente). */
export const OSCURIDAD = 0.74;

const limita = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Radio por defecto como fracción del lado menor del visor, derivado del zoom del paso: más zoom, foco más cerrado. */
export function radioPorDefecto(zoom: number): number {
  const z = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  return limita(0.5 / z, RADIO_MIN, RADIO_MAX);
}

/** Radio efectivo: el del paso si es válido (acotado), si no el derivado del zoom aplicado. */
export function radioDePaso(paso: PasoCamara & { radio?: number }, movil = false): number {
  if (typeof paso.radio === "number" && Number.isFinite(paso.radio) && paso.radio > 0) return limita(paso.radio, RADIO_MIN, RADIO_MAX);
  return radioPorDefecto(zoomAplicado(paso.zoom, movil));
}

export type GeometriaMascara = { activa: boolean; cx: number; cy: number; r: number };

/**
 * Foco en píxeles del visor. Se calcula con la misma pose que la cámara (incluido el clamp), de modo que el círculo
 * cae donde de verdad queda el detalle. Sin paso (apertura, cierre): inactiva, sin agujero.
 */
export function geometriaMascara(paso: (PasoCamara & { radio?: number }) | null, aspecto: number | null, caja: Caja, movil = false): GeometriaMascara {
  if (!paso) return { activa: false, cx: caja.w / 2, cy: caja.h / 2, r: 0 };
  const { tx, ty, z, w, h } = poseNumerica(paso, aspecto, caja, movil);
  const r = radioDePaso(paso, movil) * Math.min(caja.w, caja.h);
  return { activa: true, cx: tx + paso.x * w * z, cy: ty + paso.y * h * z, r };
}

/** Fondo CSS de la máscara: transparente en el foco, oscuro fuera, borde suave. Estático; solo se funde con opacity. */
export function fondoMascara(g: GeometriaMascara): string {
  if (!g.activa) return "none";
  const f = (n: number) => Math.round(n * 10) / 10;
  return `radial-gradient(circle at ${f(g.cx)}px ${f(g.cy)}px, rgba(12,11,9,0) ${f(g.r * 0.7)}px, rgba(12,11,9,${OSCURIDAD}) ${f(g.r * 1.3)}px)`;
}
