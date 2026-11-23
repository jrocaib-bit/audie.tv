import { beforeEach, describe, expect, it, vi } from "vitest";
import { recorridoSala } from "@/lib/sala-recorridos";

const doble = vi.hoisted(() => ({ userError: null as { message: string } | null }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: doble.userError ? null : { id: "usuario-1" } },
        error: doble.userError,
      }),
    },
  }),
}));

import { GET } from "./route";

function pedir(id: string, opciones: { token?: string; lang?: string; cabeceras?: Record<string, string> } = {}) {
  const headers = new Headers(opciones.cabeceras);
  if (opciones.token) headers.set("authorization", `Bearer ${opciones.token}`);
  const q = opciones.lang ? `?lang=${opciones.lang}` : "";
  return GET(new Request(`http://audite.test/api/sala/${id}${q}`, { headers }), { params: Promise.resolve({ id }) });
}

const r = recorridoSala("gn-01")!;

describe("ruta de La sala", () => {
  beforeEach(() => {
    doble.userError = null;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://ejemplo.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-publica-de-prueba";
  });

  it("401 sin token y el cuerpo no contiene textos narrativos", async () => {
    const res = await pedir("gn-01");
    const cuerpo = await res.text();
    expect(res.status).toBe(401);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(cuerpo).not.toContain(r.pasos[0]!.texto.es);
    expect(cuerpo).not.toContain(r.pasos[0]!.titulo.es);
    expect(cuerpo).not.toContain(r.apertura.texto.es.slice(0, 40));
    expect(cuerpo).not.toContain(r.cierre.texto.es.slice(0, 40));
  });

  it("401 con token inválido", async () => {
    doble.userError = { message: "jwt invalid" };
    const res = await pedir("gn-01", { token: "malo" });
    expect(res.status).toBe(401);
    expect(await res.text()).not.toContain(r.pasos[0]!.texto.es);
  });

  it("200 con token válido devuelve apertura, pasos y cierre en el idioma pedido", async () => {
    const res = await pedir("gn-01", { token: "bueno" });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const json = await res.json();
    expect(json.apertura.texto).toBe(r.apertura.texto.es);
    expect(json.pasos[0].texto).toBe(r.pasos[0]!.texto.es);
    expect(json.pasos).toHaveLength(r.pasos.length);
    expect(json.cierre.texto).toBe(r.cierre.texto.es);
    const en = await (await pedir("gn-01", { token: "bueno", lang: "en" })).json();
    expect(en.pasos[0].texto).toBe(r.pasos[0]!.texto.en);
  });

  it("404 con id desconocido (con sesión)", async () => {
    const res = await pedir("no-existe", { token: "bueno" });
    expect(res.status).toBe(404);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("el camino de desarrollo x-sala-mock no se activa en producción", async () => {
    const previo = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "production");
    try {
      const res = await pedir("gn-01", { cabeceras: { "x-sala-mock": "1" } });
      expect(res.status).toBe(401);
      expect(await res.text()).not.toContain(r.pasos[0]!.texto.es);
    } finally {
      vi.stubEnv("NODE_ENV", previo ?? "test");
    }
  });
});
