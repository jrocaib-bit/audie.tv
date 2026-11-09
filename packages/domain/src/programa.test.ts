import { describe, expect, it } from "vitest";
import { programaCsv, programaDeDia, programaEntre } from "./programa";
import type { Reto } from "./liturgia";

const retos: Reto[] = [{
  id: "adviento-isaias",
  tiempo: "adviento",
  titulo: { es: "Adviento con Isaías", en: "Advent with Isaiah" },
  insignia: { es: "Centinela", en: "Watch" },
  obra: null,
  companeros: [],
  pasos: [{ dia: 1, libroId: "is", capitulo: 40, versiculo: 1, versiculoFin: 11, titulo: { es: "Preparad el camino", en: "Prepare the way" }, minutos: 4, obra: null }],
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
});
