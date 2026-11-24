import { describe, expect, it } from "vitest";
import { alternarDiaReto, leerProgresoRetos } from "./retos-progreso";

describe("alternarDiaReto", () => {
  it("marca un día nuevo y avisa", () => {
    const r = alternarDiaReto(undefined, 3, 26, "2026-11-30");
    expect(r).toEqual({ progreso: { hechos: [3], fechas: ["2026-11-30"] }, nuevo: true, completado: false });
  });
  it("desmarcar no cuenta como completado", () => {
    const r = alternarDiaReto({ hechos: [3], fechas: ["2026-11-30"] }, 3, 26, "2026-11-30");
    expect(r.nuevo).toBe(false);
    expect(r.progreso.hechos).toEqual([]);
  });
  it("completa el reto con el último paso", () => {
    const hechos = Array.from({ length: 25 }, (_, i) => i + 1);
    expect(alternarDiaReto({ hechos, fechas: [] }, 26, 26, "2026-12-24").completado).toBe(true);
    expect(alternarDiaReto({ hechos: [1], fechas: [] }, 2, 26, "x").completado).toBe(false);
  });
  it("tolera almacenamiento corrupto", () => {
    expect(leerProgresoRetos("{no")).toEqual({});
    expect(leerProgresoRetos("[1]")).toEqual({});
    expect(leerProgresoRetos(null)).toEqual({});
  });
});
