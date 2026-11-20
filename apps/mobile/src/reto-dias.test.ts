import { describe, expect, it } from "vitest";
import { RETOS_APP } from "./retos-app";
import { diasParaEmpezar, indiceDeHoy, pinturasDeReto } from "./reto-dias";

describe("pinturasDeReto", () => {
  it("Adviento: 26 días, 26 pinturas distintas", () => {
    const reto = RETOS_APP.find((r) => r.id === "adviento-isaias")!;
    expect(reto.pasos).toHaveLength(26);
    expect(new Set(reto.pasos.map((p) => p.obra)).size).toBeLessThan(26);
    const srcs = pinturasDeReto(reto);
    expect(srcs).toHaveLength(26);
    expect(srcs.every(Boolean)).toBe(true);
    expect(new Set(srcs).size).toBe(26);
  });
  it("ningún reto repite pintura en sus días", () => {
    for (const reto of RETOS_APP) {
      const srcs = pinturasDeReto(reto).filter(Boolean);
      expect(new Set(srcs).size, reto.id).toBe(srcs.length);
    }
  });
  it("Profecías no tiene pintura: placa de marca en todos los días", () => {
    const reto = RETOS_APP.find((r) => r.id === "profecias-pasion")!;
    expect(pinturasDeReto(reto)).toEqual(reto.pasos.map(() => ""));
  });
});

describe("cuenta atrás y día de hoy", () => {
  it("Adviento empieza el 29 nov: el 20 nov faltan 9 días", () => {
    expect(diasParaEmpezar("2026-11-29", "2026-11-20")).toBe(9);
    expect(diasParaEmpezar("2026-11-29", "2026-11-29")).toBe(0);
    expect(diasParaEmpezar("2026-11-29", "2026-12-02")).toBe(0);
  });
  it("indiceDeHoy solo dentro del reto", () => {
    expect(indiceDeHoy("2026-11-29", "2026-11-20", 26)).toBeNull();
    expect(indiceDeHoy("2026-11-29", "2026-11-29", 26)).toBe(0);
    expect(indiceDeHoy("2026-11-29", "2026-12-24", 26)).toBe(25);
    expect(indiceDeHoy("2026-11-29", "2026-12-25", 26)).toBeNull();
  });
});
