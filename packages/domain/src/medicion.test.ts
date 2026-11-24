import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { clasificarTrafico, crearSumideroSupabase, decidirEscucha, eliminarCuenta, esEvento, eventosDePaywall, filaPreferenciaCorreo, limpiarPropiedades, plataformaCliente, prepararMedicion, propsFormulario, scriptPlausible, track, utmDeBusqueda, type ContextoMedicion, type PropsFormulario } from "./medicion";

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

  it("los eventos de formulario llevan el nombre exacto y ningún dato personal", () => {
    expect(esEvento("cta_clicked")).toBe(true);
    expect(esEvento("form_submitted")).toBe(true);
    expect(esEvento("signup_confirmed")).toBe(true);
    const props = propsFormulario({
      form_id: "soporte",
      cta_id: "mailto_soporte",
      ubicacion: "ayuda",
      idioma: "es",
      plataforma: "web",
      email: "ada@audite.tv",
      nombre: "Ada",
    } as PropsFormulario);
    expect(props).toEqual({ form_id: "soporte", cta_id: "mailto_soporte", ubicacion: "ayuda", idioma: "es", plataforma: "web" });
    expect(JSON.stringify(props)).not.toMatch(/ada@|Ada/);
    expect(plataformaCliente("ios")).toBe("ios");
    expect(plataformaCliente("android")).toBe("android");
    expect(plataformaCliente("app")).toBe("web");
    expect(utmDeBusqueda("?utm_source=ig&utm_medium=cpc&utm_campaign=adviento&email=ada@audite.tv")).toEqual({
      utm_source: "ig",
      utm_medium: "cpc",
      utm_campaign: "adviento",
    });
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

  it("prepara el progreso del reto con sesión: día completado y inscripción", () => {
    const conSesion = prepararMedicion("challenge_day_completed", { reto_id: "navidad-infancia", dia: 3, episode_id: "lc-02" }, ctx, new Date("2026-12-27T10:00:00Z"));
    expect(conSesion.progreso).toEqual({
      user_id: ctx.user_id,
      session_id: "sesion-1",
      reto_id: "navidad-infancia",
      dia: 3,
      fecha_local: "2026-12-27",
      completed_at: "2026-12-27T10:00:00.000Z",
      episode_id: "lc-02",
    });
    const inicio = prepararMedicion("challenge_started", { reto_id: "adviento-isaias" }, ctx, new Date("2026-11-29T10:00:00Z"));
    expect(inicio.progreso).toMatchObject({ user_id: ctx.user_id, reto_id: "adviento-isaias", dia: 0, completed_at: null });
  });

  it("el anónimo también deja progreso, identificado solo por su sesión", () => {
    const anon = { ...ctx, user_id: null };
    const inicio = prepararMedicion("challenge_started", { reto_id: "adviento-isaias" }, anon);
    expect(inicio.progreso).toMatchObject({ user_id: null, session_id: "sesion-1", dia: 0 });
    const dia = prepararMedicion("challenge_day_completed", { reto_id: "navidad-infancia", dia: 3, episode_id: "lc-02" }, anon);
    expect(dia.progreso).toMatchObject({ user_id: null, session_id: "sesion-1", dia: 3 });
    expect(dia.evento.platform).toBe("web");
    expect(prepararMedicion("challenge_day_completed", { reto_id: "x", dia: 0, episode_id: "" }, anon).progreso).toBeNull();
  });

  it("el sumidero usa upsert con sesión y RPC sin ella, y propaga el error de supabase", async () => {
    const llamadas: unknown[][] = [];
    const cliente = (error: { code: string } | null) => ({
      from: (t: string) => ({
        insert: async (f: unknown) => { llamadas.push(["insert", t, f]); return { error }; },
        upsert: async (f: unknown, o: unknown) => { llamadas.push(["upsert", t, f, o]); return { error }; },
      }),
      rpc: async (n: string, a: unknown) => { llamadas.push(["rpc", n, a]); return { error }; },
    });
    const fila = prepararMedicion("challenge_started", { reto_id: "adviento-isaias" }, ctx).progreso!;
    await crearSumideroSupabase(cliente(null)).progreso!(fila);
    expect(llamadas[0]).toEqual(["upsert", "reto_progreso", expect.not.objectContaining({ session_id: expect.anything() }), { onConflict: "user_id,reto_id,dia", ignoreDuplicates: true }]);
    const anon = prepararMedicion("challenge_day_completed", { reto_id: "r", dia: 2, episode_id: "e" }, { ...ctx, user_id: null }).progreso!;
    await crearSumideroSupabase(cliente(null)).progreso!(anon);
    expect(llamadas[1]).toEqual(["rpc", "registrar_reto_anonimo", { p_session_id: "sesion-1", p_reto_id: "r", p_dia: 2, p_episode_id: "e" }]);
    await expect(crearSumideroSupabase(cliente({ code: "42501" })).progreso!(fila)).rejects.toMatchObject({ code: "42501" });
  });

  it("track avisa de los fallos sin datos personales", async () => {
    const fallos: unknown[] = [];
    const sumidero = { evento: async () => { throw Object.assign(new Error("a@b.c"), { code: "42501" }); }, progreso: () => { throw new Error("x"); } };
    track("challenge_started", { reto_id: "r" }, ctx, sumidero, new Date(), (f) => fallos.push(f));
    await new Promise((r) => setTimeout(r, 0));
    expect(fallos).toEqual([{ donde: "progreso", evento: "challenge_started", codigo: "Error" }, { donde: "evento", evento: "challenge_started", codigo: "42501" }]);
  });

  it("marca tráfico interno y de bots sin guardar email ni user-agent", () => {
    expect(clasificarTrafico({ email: "TVaudite@gmail.com" })).toBe("interno");
    expect(clasificarTrafico({ email: "otra@persona.test" })).toBeNull();
    expect(clasificarTrafico({ email: "otra@persona.test", correosInternos: ["otra@persona.test"] })).toBe("interno");
    expect(clasificarTrafico({ userAgent: "Mozilla/5.0 HeadlessChrome/120" })).toBe("headless");
    expect(clasificarTrafico({ userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)" })).toBe("bot");
    expect(clasificarTrafico({ userAgent: "Mozilla/5.0 (iPhone) Safari/604" })).toBeNull();
    const p = prepararMedicion("challenge_started", { reto_id: "r" }, { ...ctx, trafico: "bot" });
    expect(p.evento.properties).toMatchObject({ is_internal: false, trafico: "bot" });
    expect(p.progreso).toBeNull();
    expect(prepararMedicion("page_view", { path: "/" }, { ...ctx, trafico: "interno" }).evento.properties).toMatchObject({ is_internal: true, trafico: "interno" });
    expect(prepararMedicion("page_view", { path: "/" }, ctx).evento.properties).toEqual({ path: "/" });
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

  it("el alta solo escribe las columnas concedidas", () => {
    expect(Object.keys(filaPreferenciaCorreo("usuario", true, "2026-11-10T00:00:00.000Z"))).toEqual(["user_id", "marketing_consent", "consent_at"]);
    expect(filaPreferenciaCorreo("usuario", false, "2026-11-10T00:00:00.000Z").consent_at).toBeNull();
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

  it("retira el borrado antiguo", () => {
    const baja = readFileSync(new URL("../../../supabase/migrations/20261110223000_drop_delete_own_account.sql", import.meta.url), "utf8");
    expect(baja).toContain("drop function if exists public.delete_own_account()");
  });

  it("borra la cuenta solo como authenticated y con search_path vacío", () => {
    expect(borrado).toContain("set search_path = ''");
    expect(borrado).toContain("delete from auth.users where id = (select auth.uid())");
    expect(borrado).toContain("revoke all on function public.delete_my_account() from public");
    expect(borrado).toContain("revoke all on function public.delete_my_account() from anon");
    expect(borrado).toContain("grant execute on function public.delete_my_account() to authenticated");
  });
});

describe("migración de inscripción de retos", () => {
  const sql = readFileSync(new URL("../../../supabase/migrations/20261123100000_reto_progreso_inscripcion_anonima.sql", import.meta.url), "utf8");
  it("abre dia 0 y deja al anónimo solo escribir por RPC", () => {
    expect(sql.startsWith("-- Preparada, no aplicada en producción.")).toBe(true);
    expect(sql).toContain("check (dia >= 0)");
    expect(sql).toContain("revoke all on table public.reto_progreso_anonimo from public, anon, authenticated");
    expect(sql).not.toMatch(/grant (select|insert|update)[^;]*reto_progreso_anonimo/);
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
  });
});
