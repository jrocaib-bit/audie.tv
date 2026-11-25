import { afterEach, describe, expect, it, vi } from "vitest";
import { CACHE_NUNCA, CACHE_PUBLICA, cabeceraCachePublica, respuestaPublica } from "./cache-publica";

const pedir = (url: string, cabeceras: Record<string, string> = {}) => new Request(url, { headers: cabeceras });

afterEach(() => vi.unstubAllEnvs());

describe("caché pública de Libros", () => {
  it("valor público con s-maxage largo y stale-while-revalidate", () => {
    expect(CACHE_PUBLICA).toBe("public, max-age=60, s-maxage=600, stale-while-revalidate=86400");
  });

  it("en producción ignora el mock y cachea siempre", () => {
    expect(cabeceraCachePublica(pedir("http://a.test/api/libros?mock=premium"), true)).toBe(CACHE_PUBLICA);
    expect(cabeceraCachePublica(pedir("http://a.test/api/libros", { "x-libros-mock": "premium" }), true)).toBe(CACHE_PUBLICA);
  });

  it("en desarrollo con mock por parámetro o cabecera no cachea", () => {
    expect(cabeceraCachePublica(pedir("http://a.test/api/libros?mock=sin"), false)).toBe(CACHE_NUNCA);
    expect(cabeceraCachePublica(pedir("http://a.test/api/libros", { "x-libros-mock": "gratis" }), false)).toBe(CACHE_NUNCA);
  });

  it("en desarrollo sin mock cachea, aunque lleve sesión o cookies", () => {
    const r = pedir("http://a.test/api/libros", { authorization: "Bearer x", cookie: "a=b" });
    expect(cabeceraCachePublica(r, false)).toBe(CACHE_PUBLICA);
  });

  it("respuestaPublica lleva la cabecera y el cuerpo", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const r = respuestaPublica({ a: 1 }, pedir("http://a.test/x?mock=premium"));
    expect(r.headers.get("cache-control")).toBe(CACHE_NUNCA);
    expect(await r.json()).toEqual({ a: 1 });
    expect(respuestaPublica({ a: 1 }, pedir("http://a.test/x")).headers.get("cache-control")).toBe(CACHE_PUBLICA);
  });
});
