import { describe, expect, it } from "vitest";
import { RETOS_APP } from "./retos-app";
import { diasParaEmpezar, indiceDeHoy, pinturasDeReto, portadaDeRetoApp, rachaDeReto, PORTADA_ADVIENTO, PORTADA_PROFECIAS } from "./reto-dias";

describe("pinturasDeReto", () => {
  it("Adviento usa la pintura de Isaías o la Anunciación, nunca un gn-*", () => {
    const reto = RETOS_APP.find((r) => r.id === "adviento-isaias")!;
    expect(reto.pasos).toHaveLength(26);
    const srcs = pinturasDeReto(reto);
    expect(srcs).toHaveLength(26);
    expect(srcs.every(Boolean)).toBe(true);
    expect(portadaDeRetoApp(reto.id)).toBe(PORTADA_ADVIENTO);
    for (const src of srcs) {
      expect(src.includes("/gn-") || src.includes("gn-11") || /\/gn-\d/.test(src)).toBe(false);
      const ok = src === PORTADA_ADVIENTO || src.includes("is-");
      expect(ok, src).toBe(true);
    }
    const propias = srcs.filter((s) => s !== PORTADA_ADVIENTO);
    expect(propias.length).toBeGreaterThanOrEqual(14);
    expect(new Set(propias).size).toBe(propias.length);
    expect(srcs.filter((s) => s === PORTADA_ADVIENTO).length).toBe(26 - propias.length);
  });
  it("Profecías tiene portada y una obra por día, de su propio catálogo", () => {
    const reto = RETOS_APP.find((r) => r.id === "profecias-pasion")!;
    expect(portadaDeRetoApp(reto.id)).toBe(PORTADA_PROFECIAS);
    const srcs = pinturasDeReto(reto);
    expect(srcs).toEqual(reto.pasos.map((p) => `/obras/reto-profecias_${p.episodio}.webp`));
    expect(new Set(srcs).size).toBe(8);
  });
});

describe("cuenta atrás, día de hoy y racha del reto", () => {
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
  it("la racha del reto es 0 si no se ha completado ningún día, aunque haya racha global", () => {
    const pasos = [{ episodio: "is-01" }, { episodio: "is-02" }];
    expect(rachaDeReto(pasos, { episodes: {} }, "2026-11-20")).toBe(0);
    expect(rachaDeReto(pasos, { episodes: { "gn-01": { completed: true, updatedAt: "2026-11-20T08:00:00Z" } } }, "2026-11-20")).toBe(0);
  });
  it("cuenta días seguidos de este reto", () => {
    const pasos = [{ episodio: "is-01" }, { episodio: "is-02" }];
    expect(rachaDeReto(pasos, { episodes: { "is-01": { completed: true, updatedAt: "2026-11-20T08:00:00Z" } } }, "2026-11-20")).toBe(1);
    expect(
      rachaDeReto(
        pasos,
        {
          episodes: {
            "is-01": { completed: true, updatedAt: "2026-11-19T08:00:00Z" },
            "is-02": { completed: true, updatedAt: "2026-11-20T08:00:00Z" },
          },
        },
        "2026-11-20",
      ),
    ).toBe(2);
  });
});
