import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const doble = vi.hoisted(() => ({
  email: "ana@audite.tv",
  status: "none",
  userError: null as { message: string } | null,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: doble.userError ? null : { id: "usuario-1", email: doble.email } },
        error: doble.userError,
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { status: doble.status }, error: null }),
        }),
      }),
    }),
  }),
}));

import { vaciarCacheTexto } from "@/lib/texto/almacen";
import { GET } from "./route";

// Texto inventado. Nada de ediciones bíblicas.
const raiz = mkdtempSync(path.join(tmpdir(), "audite-texto-"));
function escribir(idioma: string, id: string, dato: unknown) {
  mkdirSync(path.join(raiz, idioma), { recursive: true });
  writeFileSync(path.join(raiz, idioma, `${id}.json`), JSON.stringify(dato));
}
function texto(id: string, idioma = "es", extra: Record<string, unknown> = {}) {
  return {
    version: 1,
    episodio: id,
    idioma,
    muestra: true,
    fuente: "Fuente inventada",
    credito: "Crédito inventado",
    versiculos: [
      { ref: "1,1", cap: 1, v: "1", texto: "Frase inventada de prueba uno.", t: 0 },
      { ref: "1,2", cap: 1, v: "2", texto: "Frase inventada de prueba dos.", t: 5 },
    ],
    ...extra,
  };
}
escribir("es", "gn-01", texto("gn-01"));
escribir("es", "gn-02", texto("gn-02"));
escribir("en", "gn-02", texto("gn-02", "en"));
escribir("es", "gn-03", texto("gn-03", "es", { sobra: true }));

function pedir(id: string, opciones: { token?: string; query?: string; mock?: string } = {}) {
  const headers = new Headers();
  if (opciones.token) headers.set("authorization", `Bearer ${opciones.token}`);
  if (opciones.mock) headers.set("x-texto-mock", opciones.mock);
  return GET(new Request(`http://audite.test/api/texto/${encodeURIComponent(id)}${opciones.query ?? ""}`, { headers }), { params: Promise.resolve({ id }) });
}

describe("ruta de texto", () => {
  beforeEach(() => {
    vaciarCacheTexto();
    doble.email = "ana@audite.tv";
    doble.status = "none";
    doble.userError = null;
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("TEXTO_BIBLICO_ACTIVO", "1");
    vi.stubEnv("TEXTO_ACCESO", "");
    vi.stubEnv("AUDITE_TEXTO_RUTA", raiz);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proyecto.supabase.example");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "clave-de-prueba");
    vi.stubEnv("AUDIO_ACCESO", "internos");
    vi.stubEnv("AUDIO_EMAILS_PERMITIDOS", "ana@audite.tv");
    vi.stubEnv("AUDIO_GRATIS", "gn-01");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });
  afterAll(() => rmSync(raiz, { recursive: true, force: true }));

  it("responde 404 sin el interruptor maestro, aunque el acceso sea abierto", async () => {
    vi.stubEnv("TEXTO_BIBLICO_ACTIVO", "");
    vi.stubEnv("TEXTO_ACCESO", "abierto");
    const respuesta = await pedir("gn-01");
    expect(respuesta.status).toBe(404);
    expect(respuesta.headers.get("cache-control")).toBe("no-store");
    expect(await respuesta.text()).not.toContain("Frase inventada");
  });

  it("rechaza ids inválidos y recorridos de ruta", async () => {
    vi.stubEnv("TEXTO_ACCESO", "abierto");
    for (const id of ["../es/gn-01", "..", "GN-01", "a", "gn_01", "a".repeat(25), "gn-01.json"]) {
      const respuesta = await pedir(id);
      expect(respuesta.status).toBe(404);
      expect(respuesta.headers.get("cache-control")).toBe("no-store");
    }
  });

  describe("modo abierto", () => {
    it("entrega el texto sin sesión y marca si está sincronizado", async () => {
      vi.stubEnv("TEXTO_ACCESO", "abierto");
      const respuesta = await pedir("gn-02");
      expect(respuesta.status).toBe(200);
      expect(respuesta.headers.get("cache-control")).toContain("no-store");
      const cuerpo = await respuesta.json() as { episodio: string; sincronizado: boolean; versiculos: unknown[] };
      expect(cuerpo.episodio).toBe("gn-02");
      expect(cuerpo.sincronizado).toBe(true);
      expect(cuerpo.versiculos).toHaveLength(2);
    });

    it("lee el idioma pedido", async () => {
      vi.stubEnv("TEXTO_ACCESO", "abierto");
      const respuesta = await pedir("gn-02", { query: "?lang=en" });
      expect((await respuesta.json() as { idioma: string }).idioma).toBe("en");
    });

    it("responde 404 sin-texto si el episodio no tiene fichero", async () => {
      vi.stubEnv("TEXTO_ACCESO", "abierto");
      const respuesta = await pedir("ex-01");
      expect(respuesta.status).toBe(404);
      expect(await respuesta.json()).toEqual({ error: "sin-texto" });
    });

    it("responde 404 sin-texto si falta AUDITE_TEXTO_RUTA", async () => {
      vi.stubEnv("TEXTO_ACCESO", "abierto");
      vi.stubEnv("AUDITE_TEXTO_RUTA", "");
      const respuesta = await pedir("gn-01");
      expect(respuesta.status).toBe(404);
    });
  });

  describe("modo como-audio (por defecto)", () => {
    it("deja leer un episodio de audio gratis sin sesión", async () => {
      const respuesta = await pedir("gn-01");
      expect(respuesta.status).toBe(200);
    });

    it("responde 401 sin sesión cuando el audio no es gratis", async () => {
      const respuesta = await pedir("gn-02");
      expect(respuesta.status).toBe(401);
      expect(respuesta.headers.get("cache-control")).toBe("no-store");
      expect(await respuesta.text()).not.toContain("Frase inventada");
    });

    it("deja leer a quien puede escuchar", async () => {
      const respuesta = await pedir("gn-02", { token: "token" });
      expect(respuesta.status).toBe(200);
    });

    it("responde 403 a quien no puede escuchar", async () => {
      doble.email = "otra@audite.tv";
      const respuesta = await pedir("gn-02", { token: "token" });
      expect(respuesta.status).toBe(403);
      expect(respuesta.headers.get("cache-control")).toBe("no-store");
    });

    it("sigue la suscripción cuando el audio la pide", async () => {
      vi.stubEnv("AUDIO_ACCESO", "suscripcion");
      expect((await pedir("gn-02", { token: "token" })).status).toBe(403);
      doble.status = "active";
      expect((await pedir("gn-02", { token: "token" })).status).toBe(200);
    });

    it("responde 401 si el token no vale", async () => {
      doble.userError = { message: "jwt" };
      expect((await pedir("gn-02", { token: "token" })).status).toBe(401);
    });
  });

  describe("modo suscripcion", () => {
    beforeEach(() => vi.stubEnv("TEXTO_ACCESO", "suscripcion"));

    it("pide sesión incluso en episodios de audio gratis", async () => {
      expect((await pedir("gn-01")).status).toBe(401);
    });

    it("responde 403 sin suscripción activa y 200 con ella", async () => {
      expect((await pedir("gn-02", { token: "token" })).status).toBe(403);
      doble.status = "active";
      expect((await pedir("gn-02", { token: "token" })).status).toBe(200);
    });
  });

  describe("simulación de cuentas", () => {
    beforeEach(() => vi.stubEnv("TEXTO_ACCESO", "suscripcion"));

    it("en desarrollo admite ?mock y la cabecera x-texto-mock", async () => {
      expect((await pedir("gn-02", { query: "?mock=premium" })).status).toBe(200);
      expect((await pedir("gn-02", { mock: "premium" })).status).toBe(200);
      expect((await pedir("gn-02", { mock: "gratis" })).status).toBe(403);
    });

    it("en producción ignora el mock", async () => {
      vi.stubEnv("NODE_ENV", "production");
      expect((await pedir("gn-02", { query: "?mock=premium" })).status).toBe(401);
      expect((await pedir("gn-02", { mock: "premium" })).status).toBe(401);
    });
  });

  it("no filtra rutas del disco ni en la respuesta ni en los logs", async () => {
    vi.stubEnv("TEXTO_ACCESO", "abierto");
    const avisos: string[] = [];
    for (const metodo of ["warn", "error", "log", "info"] as const) {
      vi.spyOn(console, metodo).mockImplementation((...args: unknown[]) => { avisos.push(args.map(String).join(" ")); });
    }
    const invalido = await pedir("gn-03");
    expect(invalido.status).toBe(503);
    const vacio = await pedir("ex-09");
    const cuerpos = (await invalido.text()) + (await vacio.text());
    expect(avisos.length).toBeGreaterThan(0);
    for (const texto of [cuerpos, ...avisos]) {
      expect(texto).not.toContain(raiz);
      expect(texto).not.toContain(tmpdir());
    }
  });
});
