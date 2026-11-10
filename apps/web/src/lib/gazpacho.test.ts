import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { prepararGazpacho } from "../../../../scripts/gazpacho.mjs";

describe("gazpacho", () => {
  it("avisa si la descarga falla y no escribe fuentes", async () => {
    let escrito = false;
    const resultado = await prepararGazpacho({
      base: "https://fuentes.test",
      fetch: async () => { throw new Error("red"); },
      compress: async () => new Uint8Array([1]),
      write: async () => { escrito = true; },
    });
    expect(resultado.estado).toBe("reserva");
    expect(resultado.aviso).toBe("descarga");
    expect(escrito).toBe(false);
  });

  it("solo publica woff2", async () => {
    const nombres: string[] = [];
    const resultado = await prepararGazpacho({
      base: "https://fuentes.test",
      fetch: async () => ({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2]).buffer }),
      compress: async () => new Uint8Array([9]),
      write: async (archivos: { nombre: string }[]) => { nombres.push(...archivos.map((archivo) => archivo.nombre)); },
    });
    expect(resultado.estado).toBe("listo");
    expect(nombres).toEqual(["Gazpacho-Regular.woff2", "Gazpacho-Heavy.woff2"]);
    expect(resultado.css).toContain("format(\"woff2\")");
    expect(resultado.css).not.toContain(".otf");
    const fuente = readFileSync(path.resolve("scripts/gazpacho.mjs"), "utf8");
    expect(fuente).not.toMatch(/git add/);
  });
});
