import { describe, expect, it, vi } from "vitest";
import { crearCacheAudio, necesitaRenovar, resolverAudio, type FetchLike } from "./audio-url";

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

describe("necesitaRenovar", () => {
  it("no toca las descargas locales (sin expira)", () => {
    expect(necesitaRenovar(undefined, 10_000_000)).toBe(false);
  });
  it("sigue valiendo con más de un minuto de margen", () => {
    expect(necesitaRenovar(1_000_000, 900_000)).toBe(false);
  });
  it("se renueva dentro del margen o ya caducada", () => {
    expect(necesitaRenovar(1_000_000, 940_000)).toBe(true);
    expect(necesitaRenovar(1_000_000, 940_001)).toBe(true);
    expect(necesitaRenovar(1_000_000, 2_000_000)).toBe(true);
  });
  it("la caché devuelve una URL nueva tras caducar el margen", async () => {
    const cache = crearCacheAudio();
    let n = 0;
    const f = vi.fn<FetchLike>(async () => ok({ url: `https://s/${++n}.mp3`, expira: 1_000_000 }));
    const a = await resolverAudio("x", { base: "b", fetch: f, ahora: 0, cache });
    const b = await resolverAudio("x", { base: "b", fetch: f, ahora: 970_000, cache });
    expect(a.ok && b.ok && a.url !== b.url).toBe(true);
  });
});
