import { describe, expect, it } from "vitest";
import { mezcla, ratioContraste } from "./contraste";

const TARJETA = "#1B1815";
const FONDO = "#0C0B09";
const CUERPO = "#F4ECE2";
const ORO = "#C9A96E";
const AA = 4.5;

describe("contraste WCAG de la sala (pares reales)", () => {
  it("el ayudante cumple los valores de referencia", () => {
    expect(ratioContraste("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(ratioContraste("#777777", "#777777")).toBeCloseTo(1, 5);
  });
  it("cuerpo móvil (sólido) sobre tarjeta y fondo", () => {
    expect(ratioContraste(CUERPO, TARJETA)).toBeGreaterThanOrEqual(AA);
    expect(ratioContraste(CUERPO, FONDO)).toBeGreaterThanOrEqual(AA);
  });
  it("cuerpo escritorio (/90) sigue ≥ AA", () => {
    expect(ratioContraste(mezcla(CUERPO, TARJETA, 0.9), TARJETA)).toBeGreaterThanOrEqual(AA);
    expect(ratioContraste(mezcla(CUERPO, FONDO, 0.9), FONDO)).toBeGreaterThanOrEqual(AA);
  });
  it("pies de la comparativa, créditos y «comprobando» ≥ AA", () => {
    expect(ratioContraste("#E7D7C3", FONDO)).toBeGreaterThanOrEqual(AA);
    expect(ratioContraste("#C9BDAD", FONDO)).toBeGreaterThanOrEqual(AA);
    expect(ratioContraste("#B7AB9C", FONDO)).toBeGreaterThanOrEqual(AA); // escritorio (sin cambios)
    expect(ratioContraste("#D2C6B6", TARJETA)).toBeGreaterThanOrEqual(AA);
  });
  it("oro: texto sobre oscuro ≥ AA; texto oscuro sobre oro (botón, número del mapa) ≥ AA", () => {
    expect(ratioContraste(ORO, TARJETA)).toBeGreaterThanOrEqual(AA);
    expect(ratioContraste(ORO, FONDO)).toBeGreaterThanOrEqual(AA);
    expect(ratioContraste("#100E0C", ORO)).toBeGreaterThanOrEqual(AA);
  });
});
