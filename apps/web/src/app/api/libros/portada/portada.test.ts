import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { GET, NOMBRE_PORTADA } from "./[archivo]/route";

let dir = "";
const BYTES = new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4]);

beforeAll(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), "portadas-"));
  mkdirSync(path.join(dir, "portadas", "web"), { recursive: true });
  for (const nombre of ["lomo-03.webp", "cubierta-03-480.avif", "cubierta-16-960.webp", "lomo-17.webp", "Lomo-03.webp", "lomo-03.png"]) {
    writeFileSync(path.join(dir, "portadas", "web", nombre), BYTES);
  }
  writeFileSync(path.join(dir, "secreto.webp"), BYTES);
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));
afterEach(() => vi.unstubAllEnvs());

const pedir = (archivo: string, cabeceras?: Record<string, string>) => {
  vi.stubEnv("AUDITE_LIBROS_RUTA", dir);
  return GET(new Request("http://x.test/api/libros/portada/x", { headers: cabeceras }), { params: Promise.resolve({ archivo }) });
};

describe("ruta de portadas", () => {
  it("sirve un nombre válido con tipo, caché larga y ETag", async () => {
    const r = await pedir("lomo-03.webp");
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("image/webp");
    expect(r.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(r.headers.get("etag")).toMatch(/^"[0-9a-f]+-[0-9a-f]+"$/);
    expect(new Uint8Array(await r.arrayBuffer())).toEqual(BYTES);
    const avif = await pedir("cubierta-03-480.avif");
    expect(avif.headers.get("content-type")).toBe("image/avif");
    expect((await pedir("cubierta-16-960.webp")).status).toBe(200);
  });

  it("responde 304 con el mismo ETag", async () => {
    const etag = (await pedir("lomo-03.webp")).headers.get("etag") ?? "";
    const r = await pedir("lomo-03.webp", { "if-none-match": etag });
    expect(r.status).toBe(304);
    expect(r.headers.get("cache-control")).toContain("immutable");
  });

  it("rechaza recorridos de ruta, mayúsculas, extensiones y números fuera de rango", async () => {
    for (const malo of [
      "../secreto.webp", "..%2Fsecreto.webp", "../../etc/passwd", "lomo-03.webp/../x", "lomo-03.webp\n", "/lomo-03.webp",
      "Lomo-03.webp", "lomo-03.WEBP", "lomo-03.png", "lomo-03.svg", "lomo-03.webp.exe", "lomo-00.webp", "lomo-17.webp", "lomo-3.webp",
      "cubierta-03-720.webp", "cubierta-03-480.jpg", "estanteria.json", "", "lomo-03",
    ]) {
      expect(NOMBRE_PORTADA.test(malo), malo).toBe(false);
      const r = await pedir(malo);
      expect(r.status, malo).toBe(404);
    }
  });

  it("404 si el archivo válido no existe o no hay ruta", async () => {
    expect((await pedir("lomo-04.webp")).status).toBe(404);
    vi.stubEnv("AUDITE_LIBROS_RUTA", "");
    const r = await GET(new Request("http://x.test/"), { params: Promise.resolve({ archivo: "lomo-03.webp" }) });
    expect(r.status).toBe(404);
  });
});
