import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { audioListo, rutaAudio } from "./audio-listo";

const canon = path.resolve(import.meta.dirname, "../../../content/canon");

describe("audio listo", () => {
  it("lista 79 episodios del manifiesto, fuera de revisión y sin archivos de audio nuevos", () => {
    const datos = audioListo();
    const manifiesto = JSON.parse(readFileSync(path.join(canon, "01_canon/manifiesto.json"), "utf8")) as { libros: { episodios: { id: string }[] }[] };
    const ids = new Set(manifiesto.libros.flatMap((libro) => libro.episodios.map((episodio) => episodio.id)));
    expect(datos.episodios).toHaveLength(79);
    expect(new Set(datos.episodios.map((episodio) => episodio.id)).size).toBe(79);
    const revision = new Set([...datos.en_revision, ...datos.bloqueados]);
    for (const episodio of datos.episodios) {
      expect(ids.has(episodio.id)).toBe(true);
      expect(revision.has(episodio.id)).toBe(false);
      expect(episodio.duracion_s).toBeGreaterThan(0);
      expect(episodio.id.includes("..")).toBe(false);
      expect(rutaAudio(episodio.id)).toBe(`${datos.prefijo}/${episodio.id}.mp3`);
    }
    expect(datos.episodios.find((episodio) => episodio.id === "ex-13")).toBeUndefined();
    expect(datos.bloqueados).toContain("ex-13");
    const archivos = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter((archivo) => /\.(mp3|wav)$/i.test(archivo));
    expect(archivos).toEqual(["apps/web/public/demo/demo-tono.mp3"]);
  });
});
