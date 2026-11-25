import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FIXTURES = path.resolve(import.meta.dirname, "../../../lib/libros/fixtures/con-estanteria");
const FIRMA = "TOKEN_FIRMA_FALSO_456";
const BYTES = new Uint8Array([1, 2, 3, 4, 5]);

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => {
    let token = "";
    return {
      auth: {
        getUser: async (t: string) => {
          token = t;
          return t === "tok-premium" || t === "tok-gratis" ? { data: { user: { id: `u-${t}` } }, error: null } : { data: { user: null }, error: { message: "no" } };
        },
      },
      from: () => {
        const e: Record<string, unknown> = {};
        e.select = () => e;
        e.eq = () => e;
        e.maybeSingle = async () => ({ data: { status: token === "tok-premium" ? "active" : "none" }, error: null });
        return e;
      },
      storage: { from: () => ({ createSignedUrl: async (ruta: string) => ({ data: { signedUrl: `https://almacen.test/firmada/${ruta}?token=${FIRMA}` }, error: null }) }) },
    };
  },
}));

import { vaciarCacheAlmacen } from "@/lib/libros/almacen";
import { GET as GETCapitulo } from "./[id]/capitulos/[capituloId]/route";
import { GET as GETLibro } from "./[id]/route";
import { GET as GETCatalogo } from "./route";
import { GET as GETEstanteria } from "./estanteria/route";
import { GET as GETPortada } from "./portada/[archivo]/route";

const TOKENS: Record<string, string | undefined> = { "sin-sesion": undefined, gratuito: "tok-gratis", premium: "tok-premium" };
let avisos: string[] = [];

// La autenticación necesita las variables de Supabase en ambos orígenes: solo cambia de dónde salen los libros.
function conSupabase() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proyecto.test");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "clave-de-servicio-falsa");
}
function origenLocal() {
  conSupabase();
  vi.stubEnv("AUDITE_LIBROS_RUTA", FIXTURES);
}
function origenBucket() {
  conSupabase();
  vi.stubEnv("AUDITE_LIBROS_RUTA", "");
}

beforeEach(() => {
  vaciarCacheAlmacen();
  avisos = [];
  vi.stubGlobal("fetch", async (entrada: string) => {
    const ruta = new URL(String(entrada)).pathname.replace("/firmada/", "");
    if (/\.(webp|avif)$/.test(ruta)) return new Response(BYTES);
    try {
      return new Response(readFileSync(path.join(FIXTURES, ruta)));
    } catch {
      return new Response("no", { status: 404 });
    }
  });
  for (const m of ["warn", "error", "log", "info"] as const) vi.spyOn(console, m).mockImplementation((...a: unknown[]) => void avisos.push(a.map(String).join(" ")));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function capitulos(vista: string) {
  const token = TOKENS[vista];
  const salida: Record<string, { estado: number; cuerpo: string }> = {};
  for (const cap of ["prologo", "capitulo-01", "epilogo"]) {
    const request = new Request("http://audite.test/x", { headers: token ? { authorization: `Bearer ${token}` } : {} });
    const r = await GETCapitulo(request, { params: Promise.resolve({ id: "libro-prueba", capituloId: cap }) });
    salida[cap] = { estado: r.status, cuerpo: await r.text() };
  }
  return salida;
}

describe("el corte premium no cambia entre disco y bucket", () => {
  for (const vista of ["sin-sesion", "gratuito", "premium"]) {
    it(`mismo resultado para ${vista}`, async () => {
      origenLocal();
      const local = await capitulos(vista);
      origenBucket();
      vaciarCacheAlmacen();
      const remoto = await capitulos(vista);
      expect(remoto).toEqual(local);
      expect(local.prologo.estado).toBe(200);
      if (vista === "premium") expect(local["capitulo-01"].estado).toBe(200);
      else expect(local["capitulo-01"].estado).toBe(vista === "gratuito" ? 403 : 401);
    });
  }

  it("el libro y el catálogo públicos son idénticos", async () => {
    const ctx = { params: Promise.resolve({ id: "libro-prueba" }) };
    origenLocal();
    const l = [await (await GETLibro(new Request("http://a.test/x"), ctx)).text(), await (await GETCatalogo(new Request("http://a.test/api/libros"))).text(), await (await GETEstanteria(new Request("http://a.test/api/libros/estanteria"))).text()];
    origenBucket();
    vaciarCacheAlmacen();
    const b = [await (await GETLibro(new Request("http://a.test/x"), ctx)).text(), await (await GETCatalogo(new Request("http://a.test/api/libros"))).text(), await (await GETEstanteria(new Request("http://a.test/api/libros/estanteria"))).text()];
    expect(b).toEqual(l);
  });
});

describe("las URLs firmadas no salen", () => {
  it("ni en las respuestas HTTP ni en los logs", async () => {
    origenBucket();
    const ctx = { params: Promise.resolve({ id: "libro-prueba" }) };
    const respuestas = [
      await GETLibro(new Request("http://a.test/x"), ctx),
      await GETCatalogo(new Request("http://a.test/api/libros")),
      await GETEstanteria(new Request("http://a.test/api/libros/estanteria")),
      await GETPortada(new Request("http://a.test/x"), { params: Promise.resolve({ archivo: "lomo-01.webp" }) }),
    ];
    for (const r of respuestas) {
      expect(r.status).toBe(200);
      expect(r.headers.get("location")).toBeNull();
      expect([...r.headers.values()].join("\n")).not.toMatch(/almacen\.test|token=|firmada/);
      const cuerpo = new TextDecoder("latin1").decode(await r.arrayBuffer());
      expect(cuerpo).not.toMatch(new RegExp(`${FIRMA}|almacen\\.test|firmada`));
    }
    expect(avisos.join("\n")).not.toMatch(new RegExp(`${FIRMA}|almacen\\.test|clave-de-servicio`));
  });

  it("la portada se sirve por proxy con las cabeceras de siempre", async () => {
    origenBucket();
    const r = await GETPortada(new Request("http://a.test/x"), { params: Promise.resolve({ archivo: "cubierta-03-480.avif" }) });
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("image/avif");
    expect(r.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(new Uint8Array(await r.arrayBuffer())).toEqual(BYTES);
    const etag = r.headers.get("etag") ?? "";
    const r2 = await GETPortada(new Request("http://a.test/x", { headers: { "if-none-match": etag } }), { params: Promise.resolve({ archivo: "cubierta-03-480.avif" }) });
    expect(r2.status).toBe(304);
  });

  it("nombre inválido: 404 sin tocar el bucket", async () => {
    origenBucket();
    const r = await GETPortada(new Request("http://a.test/x"), { params: Promise.resolve({ archivo: "../estanteria.json" }) });
    expect(r.status).toBe(404);
  });
});
