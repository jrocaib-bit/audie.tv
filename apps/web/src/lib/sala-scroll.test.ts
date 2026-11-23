import { describe, expect, it } from "vitest";
import { recorridoSala } from "./sala-recorridos";
import { bloqueDe, etiquetaActivo, etiquetaCamara, indiceActivo, opacidadBloque, poseDeBloque, transformaPaso } from "./sala-scroll";

const r = recorridoSala("gn-01")!;
const caja = { w: 390, h: 400 };

describe("transformaPaso", () => {
  it("paso 1 de gn-01 (0.31, 0.87, ×2.6) acerca ×2.6 con origen 0 0", () => {
    const p = r.pasos[0]!;
    expect([p.x, p.y, p.zoom]).toEqual([0.31, 0.87, 2.6]);
    const t = transformaPaso(p, 1.2, caja);
    expect(t.transform).not.toBe("none");
    expect(t.transform).toContain("scale(2.6)");
    expect(t.transformOrigin).toBe("0 0");
  });
  it("centra el punto: el punto (x,y) queda en el centro de la caja", () => {
    const p = { x: 0.5, y: 0.5, zoom: 2 };
    expect(transformaPaso(p, caja.w / caja.h, caja).transform).toBe("translate(-195px, -200px) scale(2)");
  });
  it("entera / cierre: none", () => {
    expect(transformaPaso(null, 1.2, caja).transform).toBe("none");
    expect(transformaPaso(poseDeBloque(r.pasos.length + 1, r.pasos), 1.2, caja).transform).toBe("none");
    expect(transformaPaso(poseDeBloque(0, r.pasos), 1.2, caja).transform).toBe("none");
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
  it("el bloque activo es el más cercano a la línea de foco", () => {
    expect(indiceActivo([100, 600, 1100], 650)).toBe(1);
    expect(indiceActivo([-900, -300, 300], 400)).toBe(2);
    expect(indiceActivo([], 400)).toBe(0);
  });
  it("opacidad: oculto, leído, activo; reducido siempre 1", () => {
    expect(opacidadBloque({ revelado: false, activo: false }, false)).toBe(0);
    expect(opacidadBloque({ revelado: true, activo: false }, false)).toBeLessThan(1);
    expect(opacidadBloque({ revelado: true, activo: true }, false)).toBe(1);
    expect(opacidadBloque({ revelado: false, activo: false }, true)).toBe(1);
  });
});
