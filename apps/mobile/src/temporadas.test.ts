import { describe, expect, it } from "vitest";
import indice from "../../../content/canon/catalogo-indice.json";
import type { Rango } from "./caminos";
import { RETOS_APP, PROFECIAS_ID } from "./retos-app";
import { pasosDeReto, estadoDeReto, fechaCorta, modeloRetos, rangoFechas, ventanaDeReto } from "./temporadas";

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
    const pintadas = [m.principal.src, ...m.temporadas.filter((t) => !t.sinObra).map((t) => t.src)];
    // Los retos sin pintura todavía llevan placa de marca, no una obra repetida.
    expect(m.temporadas.filter((t) => !t.sinObra).every((t) => Boolean(t.src))).toBe(true);
    expect(new Set(pintadas).size).toBe(pintadas.length);
    expect(m.principal.total).toBe(516);
  });
});

describe("Profecías de la Pasión", () => {
  const catalogo = new Set((indice.episodes as { id: string }[]).map((e) => e.id));
  const rangoIds = new Set(rangos.map((r) => r.id));
  it("está en Semana Santa, del 21 al 28 de marzo (Ramos a Pascua), con 8 días", () => {
    const reto = RETOS_APP.find((r) => r.id === PROFECIAS_ID)!;
    expect(reto.tiempo).toBe("semana-santa");
    expect(reto.pasos).toHaveLength(8);
    expect(ventanaDeReto(PROFECIAS_ID)).toEqual({ inicio: "2027-03-21", fin: "2027-03-28" });
    const m = modeloRetos({ lang: "es", hoyIso: "2026-11-20", rangos, progress: { episodes: {} } });
    const t = m.temporadas.find((x) => x.id === PROFECIAS_ID)!;
    expect(t).toMatchObject({ estado: "empieza", total: 8, hechos: 0, sinObra: true, fechas: "21 mar – 28 mar", src: "" });
    const ids = m.temporadas.map((x) => x.id);
    expect(ids.indexOf(PROFECIAS_ID)).toBeGreaterThan(ids.indexOf("cuaresma-40"));
    expect(ids.indexOf(PROFECIAS_ID)).toBeLessThan(ids.indexOf("pascua-hechos"));
    expect(modeloRetos({ lang: "en", hoyIso: "2026-11-20", rangos, progress: { episodes: {} } }).temporadas.find((x) => x.id === PROFECIAS_ID)?.titulo).toBe("Profecías de la Pasión");
  });
  it("todos los días pp-NN son Próximamente y llevan profecía, cumplimiento y nota", () => {
    const pasos = pasosDeReto(PROFECIAS_ID);
    expect(pasos.map((p) => p.dia)).toEqual(Array.from({ length: 8 }, (_, i) => i + 1));
    for (const p of pasos) {
      expect(p.episodio).toMatch(/^pp-\d\d$/);
      expect(catalogo.has(p.episodio!)).toBe(false);
      expect(p.profecia && p.cumplimiento && p.nota).toBeTruthy();
    }
    expect(pasos.map((p) => p.titulo.es)).toEqual([
      "Viene tu rey",
      "Treinta monedas de plata",
      "El que compartía mi pan",
      "Hiere al pastor",
      "Como cordero llevado al matadero",
      "Dios mío, ¿por qué me has abandonado?",
      "Mirarán al que traspasaron",
      "Al tercer día",
    ]);
    expect(pasos[0]).toMatchObject({ profecia: "Za 9,9–10", cumplimiento: "Mt 21,1–17", diaLiturgico: "Domingo de Ramos" });
    expect(pasos[0].referencias).toHaveLength(3);
    for (const p of pasos) expect(p.minutos).toBeGreaterThanOrEqual(8);
    for (const p of pasos) expect(p.minutos).toBeLessThanOrEqual(11);
  });
  it("los episodios relacionados existen en el canon y algunos ya tienen audio", () => {
    const relacionados = pasosDeReto(PROFECIAS_ID).flatMap((p) => p.relacionados ?? []);
    expect(relacionados.length).toBeGreaterThan(8);
    for (const id of relacionados) expect(rangoIds.has(id)).toBe(true);
    expect(relacionados.some((id) => catalogo.has(id))).toBe(true);
    expect(catalogo.has("is-15") || rangoIds.has("is-15")).toBe(true);
  });
});
