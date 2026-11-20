import { describe, expect, it } from "vitest";
import indice from "../../../content/canon/catalogo-indice.json";
import type { Rango } from "./caminos";
import { estadoDeReto, fechaCorta, modeloRetos, rangoFechas, ventanaDeReto } from "./temporadas";

const rangos = indice.rangos as Rango[];

describe("temporadas litúrgicas 2026-27", () => {
  it("fechas reales", () => {
    expect(ventanaDeReto("adviento-isaias")).toEqual({ inicio: "2026-11-29", fin: "2026-12-24" });
    expect(ventanaDeReto("navidad-infancia")).toEqual({ inicio: "2026-12-25", fin: "2027-01-10" });
    expect(ventanaDeReto("ordinario-evangelio")).toEqual({ inicio: "2027-01-11", fin: "2027-02-09" });
    expect(ventanaDeReto("cuaresma-40")).toEqual({ inicio: "2027-02-10", fin: "2027-03-20" });
    expect(ventanaDeReto("semana-santa-pasion")).toEqual({ inicio: "2027-03-21", fin: "2027-03-27" });
    expect(ventanaDeReto("pascua-hechos")).toEqual({ inicio: "2027-03-28", fin: "2027-05-16" });
    expect(ventanaDeReto("ordinario-salmos")).toEqual({ inicio: "2027-05-17", fin: "2027-11-27" });
  });
  it("estado y textos de fecha", () => {
    const adv = ventanaDeReto("adviento-isaias");
    expect(estadoDeReto(adv, "2026-11-20")).toBe("empieza");
    expect(estadoDeReto(adv, "2026-12-01")).toBe("en-curso");
    expect(estadoDeReto(adv, "2026-12-25")).toBe("terminado");
    expect(fechaCorta("2026-11-29", "es")).toBe("29 nov");
    expect(rangoFechas(adv, "es")).toBe("29 nov – 24 dic");
    expect(rangoFechas(adv, "en")).toBe("Nov 29 – Dec 24");
  });
  it("ordena por calendario, no repite obra y cuenta el progreso", () => {
    const m = modeloRetos({ lang: "es", hoyIso: "2026-11-20", rangos, progress: { episodes: { "is-01": { completed: true }, "is-02": { completed: true } } } });
    expect(m.temporadas[0]?.id).toBe("adviento-isaias");
    expect(m.temporadas[0]).toMatchObject({ hechos: 3, total: 26, estado: "empieza", destacado: true, siguiente: "is-03" });
    const inicios = m.temporadas.map((t) => t.inicio);
    expect([...inicios].sort()).toEqual(inicios);
    const pintadas = [m.principal.src, ...m.temporadas.map((t) => t.src)];
    expect(pintadas.every(Boolean)).toBe(true);
    expect(new Set(pintadas).size).toBe(pintadas.length);
    expect(m.principal.total).toBe(516);
  });
});
