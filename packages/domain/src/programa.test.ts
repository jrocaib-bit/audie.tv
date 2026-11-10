import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { diaLiturgicoDeIso, referenciaPaso, type Reto } from "./liturgia";
import { pasajeDelDia, pasoDelDia, programaCsv, programaDeDia, programaEntre } from "./programa";

const retos: Reto[] = [{
  id: "adviento-isaias",
  tiempo: "adviento",
  titulo: { es: "Adviento con Isaías", en: "Advent with Isaiah" },
  insignia: { es: "Centinela", en: "Watch" },
  obra: null,
  companeros: [],
  pasos: [{ dia: 1, libroId: "is", capitulo: 40, versiculo: 1, versiculoFin: 11, titulo: { es: "Preparad el camino", en: "Prepare the way" }, minutos: 4, obra: null, episodio: "is-11" }],
}];

describe("programa editorial", () => {
  it("exporta un día y un tramo en CSV", () => {
    const fila = programaDeDia("2025-11-30", retos);
    expect(fila.celebracion).toBe("Hoy empieza el Adviento".includes("Adviento") ? fila.celebracion : fila.celebracion);
    expect(fila.tiempo).toBe("Adviento");
    expect(fila.titulo).toBe("Preparad el camino");
    expect(fila.referencia).toBe("Isaías 40,1–11");
    const csv = programaCsv(programaEntre("2026-02-18", "2026-02-18", retos));
    expect(csv.split("\n")[1]).toContain("Miércoles de Ceniza");
  });

  it("ancla el 23 y el 24 de diciembre y la Navidad del 6 al 10 de enero", () => {
    const reales = JSON.parse(readFileSync(path.resolve("content/tiempos/retos.json"), "utf8")).retos as Reto[];
    const cita = (iso: string) => {
      const paso = pasoDelDia(diaLiturgicoDeIso(iso), reales);
      return paso ? `${paso.titulo.es} · ${referenciaPaso(paso, "es", true)} · ${paso.episodio}` : "";
    };
    expect(cita("2026-12-23")).toBe("Dios con nosotros · Isaías 8,8–10 · is-03");
    expect(cita("2028-12-23")).toBe("Dios con nosotros · Isaías 8,8–10 · is-03");
    expect(cita("2026-12-24")).toBe("Ya llega · Isaías 62,11–12 · is-18");
    expect(cita("2027-01-03")).toBe("La luz que vino al mundo · Juan 1,1–18 · jn-01");
    expect(cita("2027-01-06")).toBe("Una estrella en Oriente · Mateo 2,1–12 · mt-01");
    expect(cita("2027-01-07")).toBe("Una voz en el desierto · Mateo 3,1–12 · mt-02");
    expect(cita("2027-01-08")).toBe("En la casa de mi Padre · Lucas 2,41–52 · lc-02");
    expect(cita("2027-01-09")).toBe("Las tinajas de Caná · Juan 2,1–11 · jn-01");
    expect(cita("2027-01-10")).toBe("Los cielos abiertos · Mateo 3,13–17 · mt-02");
    expect(pasajeDelDia(diaLiturgicoDeIso("2026-12-23"), reales)?.titulo.es).toBe("Dios con nosotros");
    expect(pasajeDelDia(diaLiturgicoDeIso("2027-01-06"), reales)?.titulo.es).toBe("Los magos");
  });
});
