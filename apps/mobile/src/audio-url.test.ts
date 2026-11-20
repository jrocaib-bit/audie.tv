import { describe, expect, it, vi } from "vitest";
import { bloqueadoPorSesion, esGratisAnonimo, idsGratisAnonimo } from "./audio-gratis";
import { crearCacheAudio, resolverAudio, type FetchLike } from "./audio-url";

const ok = (cuerpo: unknown, status = 200) => ({ status, json: async () => cuerpo });

describe("resolverAudio", () => {
  it("devuelve la URL firmada y manda Bearer solo con token", async () => {
    const f = vi.fn<FetchLike>(async () => ok({ url: "https://x.supabase.co/sign/gn-01.mp3?t=1", expira: 5_000_000 }));
    const r = await resolverAudio("gn-01", { base: "https://audite.tv", token: "abc", fetch: f, ahora: 1_000 });
    expect(r).toEqual({ ok: true, url: "https://x.supabase.co/sign/gn-01.mp3?t=1", expira: 5_000_000 });
    expect(f).toHaveBeenCalledWith("https://audite.tv/api/audio/gn-01", { headers: { Authorization: "Bearer abc" } });
    await resolverAudio("gn-01", { base: "https://audite.tv", token: null, fetch: f, ahora: 1_000 });
    expect(f).toHaveBeenLastCalledWith("https://audite.tv/api/audio/gn-01", { headers: {} });
  });
  it.each([
    [401, "entrar"],
    [403, "premium"],
    [404, "proximamente"],
    [429, "limite"],
    [503, "servidor"],
    [500, "servidor"],
  ])("estado %i -> %s", async (estado, error) => {
    expect(await resolverAudio("a", { base: "b", fetch: async () => ok({ error: "x" }, estado) })).toEqual({ ok: false, error });
  });
  it("red caída y JSON roto", async () => {
    expect(await resolverAudio("a", { base: "b", fetch: async () => { throw new Error("offline"); } })).toEqual({ ok: false, error: "red" });
    expect(await resolverAudio("a", { base: "b", fetch: async () => ({ status: 200, json: async () => { throw new Error("json"); } }) })).toEqual({ ok: false, error: "servidor" });
    expect(await resolverAudio("a", { base: "b", fetch: async () => ok({ nada: 1 }) })).toEqual({ ok: false, error: "servidor" });
    expect(await resolverAudio("a", { base: "b", fetch: async () => ok({ url: "javascript:alert(1)" }) })).toEqual({ ok: false, error: "servidor" });
  });
  it("cachea hasta un minuto antes de expirar", async () => {
    const cache = crearCacheAudio();
    const f = vi.fn<FetchLike>(async () => ok({ url: "https://s/1.mp3", expira: 1_000_000 }));
    await resolverAudio("x", { base: "b", fetch: f, ahora: 0, cache });
    await resolverAudio("x", { base: "b", fetch: f, ahora: 900_000, cache });
    expect(f).toHaveBeenCalledTimes(1);
    await resolverAudio("x", { base: "b", fetch: f, ahora: 950_000, cache });
    expect(f).toHaveBeenCalledTimes(2);
  });
});

describe("audio gratis sin sesión", () => {
  it("gn-01 y el Adviento son gratis; lo demás pide sesión", () => {
    expect(esGratisAnonimo("gn-01")).toBe(true);
    expect(esGratisAnonimo("is-01")).toBe(true);
    expect(esGratisAnonimo("gn-02")).toBe(false);
    expect(bloqueadoPorSesion("gn-02", false)).toBe(true);
    expect(bloqueadoPorSesion("gn-02", true)).toBe(false);
    expect(bloqueadoPorSesion("gn-01", false)).toBe(false);
    expect(idsGratisAnonimo().size).toBeGreaterThan(10);
  });
});
