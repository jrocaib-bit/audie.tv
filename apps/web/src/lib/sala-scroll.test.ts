import { describe, expect, it } from "vitest";
import { recorridoSala } from "./sala-recorridos";
import { bloqueDe, etiquetaActivo, etiquetaCamara, indiceActivo, opacidadBloque, poseDeBloque, transformaPaso, zoomAplicado } from "./sala-scroll";

const r = recorridoSala("gn-01")!;
const cajaAlta = { w: 720, h: 820 };
const cajaMovil = { w: 390, h: 480 };

/** Parsea `translate(tx px, ty px) scale(z)`. */
function parsea(t: string) {
  const m = /translate\((-?[\d.e-]+)px, (-?[\d.e-]+)px\) scale\(([\d.]+)\)/.exec(t)!;
  return { tx: Number(m[1]), ty: Number(m[2]), z: Number(m[3]) };
}
/** El rectángulo de la obra transformada cubre toda la caja (sin huecos). */
function cubre(res: ReturnType<typeof transformaPaso>, caja: { w: number; h: number }) {
  const { tx, ty, z } = parsea(res.transform);
  const e = 1e-6;
  return tx <= e && ty <= e && tx + res.ancho * z >= caja.w - e && ty + res.alto * z >= caja.h - e;
}

describe("transformaPaso (object-cover + clamp)", () => {
  const p1 = r.pasos[0]!;
  it("paso 1 de gn-01 (0.31, 0.87, ×2.6) en caja alta cubre y usa ×2.6 en escritorio", () => {
    expect([p1.x, p1.y, p1.zoom]).toEqual([0.31, 0.87, 2.6]);
    const t = transformaPaso(p1, 1.2, cajaAlta);
    expect(parsea(t.transform).z).toBe(2.6);
    expect(t.transformOrigin).toBe("0 0");
    expect(cubre(t, cajaAlta)).toBe(true);
  });
  it("entera / apertura / cierre: cover centrado, zoom 1, cubre", () => {
    for (const pose of [null, poseDeBloque(0, r.pasos), poseDeBloque(r.pasos.length + 1, r.pasos)]) {
      for (const caja of [cajaAlta, cajaMovil, { w: 1000, h: 300 }]) {
        const t = transformaPaso(pose, 1.2, caja);
        expect(parsea(t.transform).z).toBe(1);
        expect(cubre(t, caja)).toBe(true);
      }
    }
    // obra apaisada en caja alta: cover escala por el alto y centra el recorte horizontal
    const t = transformaPaso(null, 1.2, cajaAlta);
    expect(t.alto).toBeCloseTo(820);
    expect(t.ancho).toBeCloseTo(984);
    expect(parsea(t.transform).tx).toBeCloseTo((720 - 984) / 2);
  });
  it("todos los pasos de gn-01 cubren en caja alta, estrecha y en móvil", () => {
    for (const paso of r.pasos) for (const movil of [false, true]) for (const caja of [cajaAlta, cajaMovil, { w: 390, h: 300 }]) for (const asp of [1.2, 0.7, 2]) expect(cubre(transformaPaso(paso, asp, caja, movil), caja)).toBe(true);
  });
  it("control: punto central, zoom 2, mismo aspecto → centrado exacto y cubre", () => {
    const caja = { w: 400, h: 500 };
    const t = transformaPaso({ x: 0.5, y: 0.5, zoom: 2 }, caja.w / caja.h, caja);
    expect(t.transform).toBe("translate(-200px, -250px) scale(2)");
    expect(cubre(t, caja)).toBe(true);
  });
  it("el punto queda en el centro cuando el zoom lo permite; si no, clamp y aun así cubre", () => {
    const caja = { w: 400, h: 400 };
    const libre = transformaPaso({ x: 0.4, y: 0.6, zoom: 2 }, 1, caja);
    const l = parsea(libre.transform);
    expect(l.tx + 0.4 * 400 * l.z).toBeCloseTo(200);
    expect(l.ty + 0.6 * 400 * l.z).toBeCloseTo(200);
    const borde = transformaPaso({ x: 0.05, y: 0.95, zoom: 2 }, 1, caja);
    const b = parsea(borde.transform);
    expect(b.tx).toBe(0);
    expect(b.ty).toBe(-400);
    expect(cubre(borde, caja)).toBe(true);
  });
  it("aspecto desconocido: la obra llena la caja", () => {
    const t = transformaPaso(null, null, cajaMovil);
    expect([t.ancho, t.alto]).toEqual([390, 480]);
  });
});

describe("zoomAplicado (móvil)", () => {
  it("escritorio: el del paso; móvil: más moderado, > 1 y con tope", () => {
    expect(zoomAplicado(2.6, false)).toBe(2.6);
    const m = zoomAplicado(2.6, true);
    expect(m).toBeGreaterThan(1);
    expect(m).toBeLessThan(2.6);
    expect(m).toBeLessThanOrEqual(1.8);
    expect(zoomAplicado(6, true)).toBe(1.8);
    expect(zoomAplicado(0.5, true)).toBe(1);
    expect(zoomAplicado(0.5, false)).toBe(1);
  });
  it("paso 1 en móvil: zoom menor y el visor sigue cubierto", () => {
    const p = r.pasos[0]!;
    const t = transformaPaso(p, 1.2, cajaMovil, true);
    expect(parsea(t.transform).z).toBe(zoomAplicado(2.6, true));
    expect(parsea(t.transform).z).toBeLessThan(parsea(transformaPaso(p, 1.2, cajaMovil, false).transform).z);
    expect(cubre(t, cajaMovil)).toBe(true);
  });
});

describe("bloques del relato", () => {
  it("apertura, pasos y cierre", () => {
    expect(bloqueDe(0, 5)).toEqual({ tipo: "apertura" });
    expect(bloqueDe(2, 5)).toEqual({ tipo: "paso", n: 2 });
    expect(bloqueDe(6, 5)).toEqual({ tipo: "cierre" });
    expect(etiquetaCamara(2, 5)).toBe("paso-2");
    expect(etiquetaCamara(0, 5)).toBe("entera");
    expect(etiquetaCamara(6, 5)).toBe("entera");
    expect(etiquetaActivo(3, 5)).toBe("3");
    expect(etiquetaActivo(0, 5)).toBe("apertura");
  });
  it("el bloque activo es el último cuyo título ya entró en la franja (top ≤ línea)", () => {
    expect(indiceActivo([-900, -300, 300], 400)).toBe(2);
    expect(indiceActivo([-100, 380, 900], 400)).toBe(1);
    expect(indiceActivo([-100, 420, 900], 400)).toBe(0);
    expect(indiceActivo([], 400)).toBe(0);
  });
  it("un paso no se activa antes de que su título entre, y no a la vez que el siguiente", () => {
    // bloques de 300 px, línea en 200: cada título pasa por la línea de uno en uno
    const tops = (scroll: number) => [0, 1, 2, 3].map((i) => i * 300 - scroll);
    const activos = [0, 50, 150, 250, 450, 550, 750, 850].map((s) => indiceActivo(tops(s), 200));
    expect(activos).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });
  it("opacidad: oculto, leído, activo; reducido siempre 1", () => {
    expect(opacidadBloque({ revelado: false, activo: false }, false)).toBe(0);
    expect(opacidadBloque({ revelado: true, activo: false }, false)).toBeLessThan(1);
    expect(opacidadBloque({ revelado: true, activo: true }, false)).toBe(1);
    expect(opacidadBloque({ revelado: false, activo: false }, true)).toBe(1);
  });
});
