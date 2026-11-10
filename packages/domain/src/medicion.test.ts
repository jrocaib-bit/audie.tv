import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { decidirEscucha, eliminarCuenta, esEvento, eventosDePaywall, limpiarPropiedades, prepararMedicion, scriptPlausible, track, type ContextoMedicion } from "./medicion";

const ctx: ContextoMedicion = {
  platform: "web",
  app_version: "0.1.0",
  locale: "es",
  session_id: "sesion-1",
  user_id: "11111111-1111-1111-1111-111111111111",
};

describe("medición", () => {
  it("quita datos personales y deja solo el host del referrer", () => {
    const limpio = limpiarPropiedades({
      path: "/es",
      email: "ada@audite.tv",
      user_name: "Ada",
      phone: "+34000000000",
      ip: "203.0.113.8",
      texto: "un versículo",
      versiculo: "1,1",
      referrer: "https://ejemplo.test/camino?q=1",
    });
    expect(limpio).toEqual({ path: "/es", referrer: "ejemplo.test" });
    expect(JSON.stringify(limpio)).not.toMatch(/ada@|Ada|203\.0\.113/);
  });

  it("solo acepta nombres del catálogo", () => {
    expect(esEvento("page_view")).toBe(true);
    expect(esEvento("playback_progress")).toBe(true);
    expect(esEvento("Email")).toBe(false);
    expect(esEvento("compra")).toBe(false);
    expect(eventosDePaywall(false, "ver")).toBe("paywall_view");
    expect(eventosDePaywall(false, "plan")).toBe("plan_selected");
    expect(eventosDePaywall(false, "comprar")).toBeNull();
    expect(eventosDePaywall(false, "cancelar")).toBeNull();
    expect(eventosDePaywall(true, "probar")).toBe("trial_started");
    expect(eventosDePaywall(true, "comprar")).toBe("purchase_completed");
  });

  it("no propaga un fallo del envío", async () => {
    const evento = vi.fn(async () => {
      throw new Error("red");
    });
    expect(() => track("page_view", { path: "/es" }, ctx, { evento })).not.toThrow();
    await Promise.resolve();
    expect(evento).toHaveBeenCalledOnce();
  });

  it("prepara el upsert de reto_progreso solo con sesión", () => {
    const conSesion = prepararMedicion("challenge_day_completed", { reto_id: "navidad-infancia", dia: 3, episode_id: "lc-02" }, ctx, new Date("2026-12-27T10:00:00Z"));
    expect(conSesion.progreso).toEqual({
      user_id: ctx.user_id,
      reto_id: "navidad-infancia",
      dia: 3,
      fecha_local: "2026-12-27",
      completed_at: "2026-12-27T10:00:00.000Z",
      episode_id: "lc-02",
    });
    const anonimo = prepararMedicion("challenge_day_completed", { reto_id: "navidad-infancia", dia: 3, episode_id: "lc-02" }, { ...ctx, user_id: null });
    expect(anonimo.progreso).toBeNull();
    expect(anonimo.evento.platform).toBe("web");
    expect(anonimo.evento.session_id).toBe("sesion-1");
  });

  it("marca el 25, el 50 y el 75 una sola vez", () => {
    const primero = decidirEscucha({ episodeId: null, empezado: false, completado: false, marcas: [] }, { episodeId: "gn-01", status: "playing", fraccion: 0.26 });
    expect(primero.eventos.map((item) => item.nombre)).toEqual(["playback_started", "playback_progress"]);
    expect(primero.eventos[1]).toMatchObject({ marca: 25 });
    const segundo = decidirEscucha(primero.estado, { episodeId: "gn-01", status: "playing", fraccion: 0.8 });
    expect(segundo.eventos.map((item) => item.marca)).toEqual([50, 75]);
    const tercero = decidirEscucha(segundo.estado, { episodeId: "gn-01", status: "ended", fraccion: 1 });
    expect(tercero.eventos.map((item) => item.nombre)).toEqual(["episode_completed"]);
  });

  it("carga Plausible solo con dominio", () => {
    expect(scriptPlausible(undefined)).toBeNull();
    expect(scriptPlausible("  ")).toBeNull();
    expect(scriptPlausible("audite.tv")).toEqual({ src: "https://plausible.io/js/script.js", domain: "audite.tv" });
  });
});

describe("borrado de cuenta", () => {
  it("llama a delete_my_account y cierra la sesión", async () => {
    const rpc = vi.fn(async () => ({ error: null }));
    const signOut = vi.fn(async () => undefined);
    await expect(eliminarCuenta({ rpc, signOut })).resolves.toBe("hecha");
    expect(rpc).toHaveBeenCalledWith("delete_my_account");
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("no cierra la sesión si la función falla", async () => {
    const signOut = vi.fn(async () => undefined);
    await expect(eliminarCuenta({ rpc: async () => ({ error: { message: "no" } }), signOut })).resolves.toBe("error");
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe("migración de medición", () => {
  const sql = readFileSync(new URL("../../../supabase/migrations/20261110220000_analytics.sql", import.meta.url), "utf8");
  const borrado = readFileSync(new URL("../../../supabase/migrations/20261110221000_delete_my_account.sql", import.meta.url), "utf8");

  it("deja los eventos en solo inserción y el reto al dueño", () => {
    expect(sql).toContain("check (event_name ~ '^[a-z_]{2,48}$')");
    expect(sql).toContain("octet_length(properties::text) < 4096");
    expect(sql).toContain("analytics_events_occurred_at_idx");
    expect(sql).toContain("analytics_events_name_occurred_idx");
    expect(sql).toContain("analytics_events_user_occurred_idx");
    expect(sql).toContain("to anon");
    expect(sql).toContain("with check (user_id is null)");
    expect(sql).toContain("user_id = (select auth.uid())");
    expect(sql).not.toMatch(/for select[\s\S]*analytics_events/);
    expect(sql).toContain("grant select, insert, update on table public.reto_progreso to authenticated");
    expect(sql).not.toContain("grant delete");
  });

  it("borra la cuenta solo como authenticated y con search_path vacío", () => {
    expect(borrado).toContain("set search_path = ''");
    expect(borrado).toContain("delete from auth.users where id = (select auth.uid())");
    expect(borrado).toContain("revoke all on function public.delete_my_account() from public");
    expect(borrado).toContain("revoke all on function public.delete_my_account() from anon");
    expect(borrado).toContain("grant execute on function public.delete_my_account() to authenticated");
  });
});
