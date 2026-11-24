import { beforeEach, describe, expect, it, vi } from "vitest";
import { idsSala, recorridoSala } from "@/lib/sala-recorridos";
import { reportajePremium } from "@/lib/sala-reportaje";

const doble = vi.hoisted(() => ({
  userError: null as { message: string } | null,
  status: null as string | null,
  lecturas: [] as string[],
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (_url: string, clave: string) => ({
    auth: {
      getUser: async () => ({
        data: { user: doble.userError ? null : { id: "usuario-1" } },
        error: doble.userError,
      }),
    },
    from: (tabla: string) => ({
      select: (columnas: string) => ({
        eq: () => ({
          maybeSingle: async () => {
            doble.lecturas.push(`${clave}:${tabla}:${columnas}`);
            return { data: doble.status === null ? null : { status: doble.status }, error: null };
          },
        }),
      }),
    }),
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
const paso2 = r.pasos[1]!;
expect(paso2.titulo.es).toBe("La fuente de los cuatro caños");

/** Nada posterior a la apertura puede aparecer en el cuerpo. */
function sinFuga(cuerpo: string) {
  for (const p of r.pasos) {
    expect(cuerpo).not.toContain(p.texto.es.slice(0, 40));
    expect(cuerpo).not.toContain(p.titulo.es);
    expect(cuerpo).not.toContain(p.texto.en.slice(0, 40));
  }
  expect(cuerpo).not.toContain("La fuente de los cuatro caños");
  expect(cuerpo).not.toContain(r.cierre.texto.es.slice(0, 40));
  expect(cuerpo).not.toContain(r.cierre.titulo.es);
  // La comparativa (pies, entrada, créditos, imágenes) y los radios de la máscara son solo premium.
  for (const lang of ["es", "en"] as const) {
    const c = reportajePremium("gn-01", lang).comparativa!;
    for (const t of [c.entrada, c.creditos, ...c.imagenes.flatMap((i) => [i.pie, i.alt])]) expect(cuerpo).not.toContain(t.replace(/'/g, "\\u0027"));
    for (const t of [c.entrada, c.creditos, ...c.imagenes.map((i) => i.pie)]) expect(cuerpo).not.toContain(t);
  }
  expect(cuerpo).not.toMatch(/Durero|Dürer|durero-|comparativa|"radio"/);
  expect(cuerpo).not.toContain('"pasos"');
  expect(cuerpo).not.toContain('"cierre"');
}

describe("ruta de La sala", () => {
  beforeEach(() => {
    doble.userError = null;
    doble.status = null;
    doble.lecturas = [];
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://ejemplo.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-publica-de-prueba";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "servicio-de-prueba";
  });

  it("sin token: 200 sin-sesion con solo la apertura y no-store", async () => {
    const res = await pedir("gn-01");
    const cuerpo = await res.text();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const json = JSON.parse(cuerpo);
    expect(json.acceso).toBe("sin-sesion");
    expect(json.apertura.texto).toBe(r.apertura.texto.es);
    sinFuga(cuerpo);
  });

  it("token inválido: 200 sin-sesion, sin pasos ni cierre", async () => {
    doble.userError = { message: "jwt invalid" };
    const res = await pedir("gn-01", { token: "malo" });
    expect(res.status).toBe(200);
    const cuerpo = await res.text();
    expect(JSON.parse(cuerpo).acceso).toBe("sin-sesion");
    sinFuga(cuerpo);
  });

  it("token válido sin premium (sin fila, none, pending, inactive, desconocido): gratuito, sin fuga", async () => {
    for (const status of [null, "none", "pending", "inactive", "otro"]) {
      doble.status = status;
      const res = await pedir("gn-01", { token: "bueno" });
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toBe("no-store");
      const cuerpo = await res.text();
      expect(JSON.parse(cuerpo).acceso, String(status)).toBe("gratuito");
      sinFuga(cuerpo);
    }
  });

  it("sin clave de servicio no se puede leer la suscripción: gratuito", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    doble.status = "active";
    const cuerpo = await (await pedir("gn-01", { token: "bueno" })).text();
    expect(JSON.parse(cuerpo).acceso).toBe("gratuito");
    sinFuga(cuerpo);
  });

  it("premium (status active): apertura, pasos y cierre en el idioma pedido; solo se lee `status`", async () => {
    doble.status = "active";
    const res = await pedir("gn-01", { token: "bueno" });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const json = await res.json();
    expect(json.acceso).toBe("premium");
    expect(json.apertura.texto).toBe(r.apertura.texto.es);
    expect(json.pasos).toHaveLength(r.pasos.length);
    expect(json.pasos[1].titulo).toBe("La fuente de los cuatro caños");
    expect(json.pasos[1].texto).toBe(paso2.texto.es);
    expect(json.cierre.texto).toBe(r.cierre.texto.es);
    const en = await (await pedir("gn-01", { token: "bueno", lang: "en" })).json();
    expect(en.pasos[0].texto).toBe(r.pasos[0]!.texto.en);
    expect(json.pasos[0].radio).toBe(0.18);
    expect(json.comparativa.trasPaso).toBe(5);
    expect(json.comparativa.imagenes).toHaveLength(2);
    expect(json.comparativa.creditos).toContain("National Gallery of Art");
    expect(en.comparativa.imagenes[0].pie).toContain("Dürer");
    const otra = idsSala().find((x) => x !== "gn-01")!;
    const sinFicha = await (await pedir(otra, { token: "bueno" })).json();
    expect(sinFicha.acceso).toBe("premium");
    expect(sinFicha).not.toHaveProperty("comparativa");
    expect(sinFicha.pasos.every((p: { radio?: number }) => typeof p.radio === "number" && p.radio >= 0.14 && p.radio <= 0.36)).toBe(true);
    expect(doble.lecturas.every((l) => l.endsWith(":subscription_status:status"))).toBe(true);
  });

  it("404 con id desconocido y 503 si faltan claves públicas con token", async () => {
    expect((await pedir("no-existe", { token: "bueno" })).status).toBe(404);
    expect((await pedir("no-existe")).status).toBe(404);
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect((await pedir("gn-01", { token: "bueno" })).status).toBe(503);
  });

  it("mock de desarrollo: sin | gratis | premium (y con)", async () => {
    for (const [mock, acceso] of [["sin", "sin-sesion"], ["gratis", "gratuito"], ["premium", "premium"], ["con", "premium"]] as const) {
      const json = await (await pedir("gn-01", { cabeceras: { "x-sala-mock": mock } })).json();
      expect(json.acceso, mock).toBe(acceso);
      if (acceso !== "premium") sinFuga(JSON.stringify(json));
      else expect(json.pasos).toHaveLength(r.pasos.length);
    }
  });

  it("el mock no se activa en producción: solo adelanto", async () => {
    const previo = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "production");
    try {
      for (const mock of ["premium", "con", "1"]) {
        const cuerpo = await (await pedir("gn-01", { cabeceras: { "x-sala-mock": mock } })).text();
        expect(JSON.parse(cuerpo).acceso).toBe("sin-sesion");
        sinFuga(cuerpo);
      }
    } finally {
      vi.stubEnv("NODE_ENV", previo ?? "test");
    }
  });
});
