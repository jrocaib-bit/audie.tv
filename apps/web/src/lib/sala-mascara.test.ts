import { describe, expect, it } from "vitest";
import { fondoMascara, geometriaMascara, radioDePaso, radioPorDefecto, RADIO_MAX, RADIO_MIN } from "./sala-mascara";
import { poseNumerica, transformaPaso } from "./sala-scroll";

const PASOS = [
  { x: 0.31, y: 0.87, zoom: 2.6 },
  { x: 0.55, y: 0.42, zoom: 2.4 },
  { x: 0.4, y: 0.56, zoom: 2.6 },
  { x: 0.66, y: 0.83, zoom: 2.7 },
  { x: 0.88, y: 0.72, zoom: 2.5 },
];
const CAJAS = [{ w: 390, h: 546 }, { w: 830, h: 900 }, { w: 1440, h: 900 }];

describe("radioPorDefecto", () => {
  it("se deriva del zoom y queda acotado y finito", () => {
    expect(radioPorDefecto(1)).toBe(RADIO_MAX);
    expect(radioPorDefecto(2.6)).toBeCloseTo(0.5 / 2.6, 5);
    expect(radioPorDefecto(100)).toBe(RADIO_MIN);
    for (const z of [0, -3, NaN, Infinity, 1.4, 2.6, 8]) {
      const r = radioPorDefecto(z);
      expect(Number.isFinite(r)).toBe(true);
      expect(r).toBeGreaterThanOrEqual(RADIO_MIN);
      expect(r).toBeLessThanOrEqual(RADIO_MAX);
    }
  });
  it("más zoom, foco más cerrado", () => {
    expect(radioPorDefecto(2)).toBeGreaterThanOrEqual(radioPorDefecto(3));
  });
  it("el radio del paso manda si es válido, acotado; si no, el del zoom aplicado", () => {
    expect(radioDePaso({ x: 0.5, y: 0.5, zoom: 2.6, radio: 0.2 })).toBe(0.2);
    expect(radioDePaso({ x: 0.5, y: 0.5, zoom: 2.6, radio: 5 })).toBe(RADIO_MAX);
    expect(radioDePaso({ x: 0.5, y: 0.5, zoom: 2.6, radio: NaN })).toBe(radioPorDefecto(2.6));
    expect(radioDePaso({ x: 0.5, y: 0.5, zoom: 2.6 }, true)).toBe(radioPorDefecto(1.8));
  });
});

describe("geometriaMascara", () => {
  it("apertura y cierre (sin paso): inactiva, sin agujero ni fondo", () => {
    const g = geometriaMascara(null, 1, CAJAS[0]!);
    expect(g.activa).toBe(false);
    expect(g.r).toBe(0);
    expect(fondoMascara(g)).toBe("none");
  });
  it("con paso: el foco cae donde la cámara deja el detalle y dentro del visor", () => {
    for (const caja of CAJAS) {
      for (const movil of [false, true]) {
        for (const aspecto of [1, 0.8, 1.4, null]) {
          for (const p of PASOS) {
            const g = geometriaMascara(p, aspecto, caja, movil);
            const { tx, ty, z, w, h } = poseNumerica(p, aspecto, caja, movil);
            expect(g.activa).toBe(true);
            expect(g.cx).toBeCloseTo(tx + p.x * w * z, 6);
            expect(g.cy).toBeCloseTo(ty + p.y * h * z, 6);
            expect(g.cx).toBeGreaterThanOrEqual(0);
            expect(g.cx).toBeLessThanOrEqual(caja.w);
            expect(g.cy).toBeGreaterThanOrEqual(0);
            expect(g.cy).toBeLessThanOrEqual(caja.h);
            expect(Number.isFinite(g.r)).toBe(true);
            expect(g.r).toBeGreaterThan(0);
            expect(g.r).toBeLessThanOrEqual(RADIO_MAX * Math.min(caja.w, caja.h) + 1e-9);
          }
        }
      }
    }
  });
  it("sin clamp el foco está en el centro del visor", () => {
    const g = geometriaMascara({ x: 0.5, y: 0.5, zoom: 2 }, 1, { w: 500, h: 500 });
    expect(g.cx).toBeCloseTo(250, 6);
    expect(g.cy).toBeCloseTo(250, 6);
  });
  it("el fondo es un degradado radial centrado en el foco con el centro transparente", () => {
    const f = fondoMascara(geometriaMascara(PASOS[0]!, 1, CAJAS[0]!));
    expect(f).toMatch(/^radial-gradient\(circle at [\d.]+px [\d.]+px, rgba\(12,11,9,0\) /);
  });
  it("no altera la cámara: transformaPaso sigue dando la misma pose", () => {
    const t = transformaPaso(PASOS[0]!, 1, CAJAS[0]!, true);
    const p = poseNumerica(PASOS[0]!, 1, CAJAS[0]!, true);
    expect(t.transform).toBe(`translate(${p.tx}px, ${p.ty}px) scale(${p.z})`);
  });
});
