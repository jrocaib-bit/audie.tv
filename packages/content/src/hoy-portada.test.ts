import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { elegirPortadaHoy, libroDeEpisodio } from "./obras";

const retos = JSON.parse(readFileSync(path.resolve("content/tiempos/retos.json"), "utf8")).retos as {
  id: string;
  pasos: { libroId: string; episodio: string | null; titulo: { es: string } }[];
}[];

describe("portada de Hoy", () => {
  it("falla si la obra pertenece a otro libro", () => {
    for (const reto of retos) {
      for (const paso of reto.pasos) {
        const eleccion = elegirPortadaHoy({ retoId: reto.id, libroId: paso.libroId, episodio: paso.episodio });
        if (eleccion.tipo === "episodio") {
          expect(libroDeEpisodio(eleccion.episodio)).toBe(paso.libroId);
          expect(eleccion.src).toContain(`${paso.libroId}-`);
        }
        if (eleccion.tipo === "reto") {
          expect(eleccion.src).not.toMatch(/\/obras\/(?!reto-)/);
          expect(eleccion.retoId).toBe(reto.id);
        }
      }
    }
    const nina = retos.find((reto) => reto.id === "ordinario-evangelio")?.pasos.find((paso) => paso.titulo.es === "La niña");
    expect(nina?.libroId).toBe("mc");
    expect(elegirPortadaHoy({ retoId: "ordinario-evangelio", libroId: "mc", episodio: nina?.episodio ?? "mc-02" })).toMatchObject({ tipo: "episodio", libroId: "mc", episodio: "mc-02" });
  });

  it("usa la obra verificada cuando el episodio es de ese libro", () => {
    const eleccion = elegirPortadaHoy({ retoId: "sin-portada", libroId: "gn", episodio: "gn-01" });
    expect(eleccion).toMatchObject({ tipo: "episodio", libroId: "gn", episodio: "gn-01" });
  });
});
