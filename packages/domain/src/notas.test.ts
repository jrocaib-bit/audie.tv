import { describe, expect, it } from "vitest";
import { agregarNota, alternarFavorito, borrarNota, esFavorito, marcadoresVacios, notasDe, parseMarcadores } from "./notas";

describe("favoritos y notas", () => {
  it("marca y desmarca un episodio sin cuenta", () => {
    const con = alternarFavorito(marcadoresVacios(), "gn-01", "2026-11-09T12:00:00.000Z");
    expect(esFavorito(con, "gn-01")).toBe(true);
    expect(esFavorito(alternarFavorito(con, "gn-01", "luego"), "gn-01")).toBe(false);
  });

  it("guarda una nota de versículo con el segundo para volver", () => {
    const marcada = agregarNota(marcadoresVacios(), { episodeId: "gn-01", versiculo: "1:3", texto: "  la luz  ", segundo: 12.5 }, "2026-11-09T12:00:00.000Z");
    expect(marcada?.notas[0]).toMatchObject({ versiculo: "1:3", texto: "la luz", segundo: 12.5 });
    expect(notasDe(marcada ?? marcadoresVacios(), "gn-01")).toHaveLength(1);
    expect(agregarNota(marcadoresVacios(), { episodeId: "gn-01", versiculo: null, texto: "   ", segundo: null }, "ahora")).toBeNull();
  });

  it("recupera lo guardado y permite borrar", () => {
    const leido = parseMarcadores({
      favoritos: [{ episodeId: "gn-01" }],
      notas: [{ id: "n1", episodeId: "gn-01", texto: "nota", segundo: -4, versiculo: " 2:7 " }, { id: "mala" }],
    });
    expect(leido.favoritos).toHaveLength(1);
    expect(leido.notas[0]?.segundo).toBe(0);
    expect(leido.notas[0]?.versiculo).toBe("2:7");
    expect(borrarNota(leido, "n1").notas).toHaveLength(0);
  });
});
