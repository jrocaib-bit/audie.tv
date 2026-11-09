import { describe, expect, it } from "vitest";
import { migrarCamino, migrarProgreso, rangosAntiguos } from "./migrar-escucha";
import { emptyPath } from "./path";
import type { ProgressState } from "./progress";

const nuevos = [
  { id: "gn-01", bookId: "gn", orden: 1, rango: "1:1-2:25" },
  { id: "gn-05", bookId: "gn", orden: 5, rango: "13:1-15:21" },
  { id: "gn-06", bookId: "gn", orden: 6, rango: "16:1-18:33" },
  { id: "gn-07", bookId: "gn", orden: 7, rango: "19:1-20:18" },
  { id: "gn-08", bookId: "gn", orden: 8, rango: "21:1-23:20" },
  { id: "gn-09", bookId: "gn", orden: 9, rango: "24:1-24:67" },
  { id: "gn-10", bookId: "gn", orden: 10, rango: "25:1-26:35" },
];

describe("migración de la renumeración", () => {
  it("conserva el mismo rango y, si se parte, retoma el primer episodio nuevo", () => {
    expect(rangosAntiguos().find((episodio) => episodio.id === "gn-05")?.rango).toBe("13:1-17:27");
    expect(rangosAntiguos().find((episodio) => episodio.id === "gn-07")?.rango).toBe("22:1-26:35");
    const guardado: ProgressState = {
      version: 1,
      listenedOn: ["2026-11-01"],
      episodes: {
        "gn-01": { positionSeconds: 40, completed: false, updatedAt: "t1" },
        "gn-05": { positionSeconds: 100, completed: false, updatedAt: "t2" },
        "gn-07": { positionSeconds: 10, completed: true, updatedAt: "t3" },
      },
    };
    const migrado = migrarProgreso(guardado, nuevos);
    expect(migrado.revision).toBe(2);
    expect(migrado.listenedOn).toEqual(["2026-11-01"]);
    expect(migrado.episodes["gn-01"]).toMatchObject({ positionSeconds: 40, completed: false });
    expect(migrado.episodes["gn-05"]).toMatchObject({ positionSeconds: 0, completed: false });
    expect(migrado.episodes["gn-06"]).toBeUndefined();
    expect(migrado.episodes["gn-07"]).toBeUndefined();
    expect(migrado.episodes["gn-08"]).toBeUndefined();
    expect(migrado.episodes["gn-09"]?.completed).toBe(true);
    expect(migrado.episodes["gn-10"]?.completed).toBe(true);
    expect(migrarProgreso(migrado, nuevos)).toEqual(migrado);
  });

  it("no añade episodios de más al camino", () => {
    const camino = migrarCamino({ ...emptyPath("t"), steps: [{ episodeId: "gn-07" }, { episodeId: "gn-01" }] }, nuevos);
    expect(camino.steps.map((paso) => paso.episodeId)).toEqual(["gn-08", "gn-01"]);
    expect(camino.revision).toBe(2);
  });
});
