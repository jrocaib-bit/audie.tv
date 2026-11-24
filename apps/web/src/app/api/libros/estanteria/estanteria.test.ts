import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

afterEach(() => vi.unstubAllEnvs());

describe("API de la estantería", () => {
  it("devuelve la lista con caché corta y sin ningún texto de capítulos", async () => {
    vi.stubEnv("AUDITE_LIBROS_RUTA", path.resolve(import.meta.dirname, "../../../../lib/libros/fixtures/con-estanteria"));
    const r = await GET(new Request("http://a.test/api/libros/estanteria"));
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toContain("s-maxage=600");
    const texto = await r.text();
    expect(texto).not.toContain("TEXTO_PREMIUM");
    expect(texto).not.toContain("TEXTO_ADELANTO");
    const cuerpo = JSON.parse(texto) as { volumenes: { id: string; disponibilidad: string }[] };
    expect(cuerpo.volumenes.map((v) => v.id)).toEqual(["libro-prueba", "completo-sin-texto", "en-borrador"]);
  });

  it("404 sin ruta", async () => {
    vi.stubEnv("AUDITE_LIBROS_RUTA", "");
    expect((await GET(new Request("http://a.test/api/libros/estanteria"))).status).toBe(404);
  });
});
