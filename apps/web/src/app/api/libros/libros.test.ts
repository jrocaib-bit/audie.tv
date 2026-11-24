import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const doble = vi.hoisted(() => ({
  estados: { "tok-premium": "active", "tok-gratis": "none", "tok-roto": "active" } as Record<string, string>,
  falloEstado: false,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => {
    let token = "";
    return {
      auth: {
        getUser: async (t: string) => {
          token = t;
          return t in doble.estados ? { data: { user: { id: `u-${t}`, email: "x@audite.test" } }, error: null } : { data: { user: null }, error: { message: "no" } };
        },
      },
      from: (tabla: string) => {
        const encadenado: Record<string, unknown> = {};
        encadenado.select = () => encadenado;
        encadenado.eq = () => encadenado;
        encadenado.maybeSingle = async () => {
          if (tabla !== "subscription_status") return { data: null, error: { code: "42P01", message: "relation does not exist" } };
          if (doble.falloEstado) return { data: null, error: { message: "caído" } };
          return { data: { status: doble.estados[token] ?? "none" }, error: null };
        };
        // Cualquier tabla libros_* aún no existe: todo degrada a memoria.
        const ausente = async () => ({ data: null, error: { code: "42P01", message: "relation does not exist" } });
        encadenado.then = (ok: (v: unknown) => unknown) => ausente().then(ok);
        encadenado.upsert = ausente;
        encadenado.delete = () => encadenado;
        return encadenado;
      },
    };
  },
}));

import { GET as GETCatalogo } from "./route";
import { GET as GETLibro } from "./[id]/route";
import { GET as GETCapitulo } from "./[id]/capitulos/[capituloId]/route";
import { GET as GETAcceso } from "./acceso/route";
import { GET as GETProgreso, PUT as PUTProgreso } from "./[id]/progreso/route";
import { DELETE as DELNotas, GET as GETNotas, POST as POSTNotas } from "./[id]/notas/route";
import { POST as POSTSub } from "./[id]/subrayados/route";
import { GET as GETEpisodios } from "../episodios/[episodeId]/libros/route";
import { vaciarMemoria } from "@/lib/libros/anotaciones";

const FIXTURES = path.resolve(import.meta.dirname, "../../../lib/libros/fixtures");
const PREMIUM = "TEXTO_PREMIUM_CAPITULO_PRUEBA_XYZ";
const EPILOGO = "TEXTO_PREMIUM_EPILOGO_PRUEBA_XYZ";

function pedir(ruta: string, opciones: { token?: string; mock?: string; cabeceraMock?: string; metodo?: string; cuerpo?: unknown } = {}) {
  const headers = new Headers();
  if (opciones.token) headers.set("authorization", `Bearer ${opciones.token}`);
  if (opciones.cabeceraMock) headers.set("x-libros-mock", opciones.cabeceraMock);
  const url = `http://audite.test${ruta}${opciones.mock ? `${ruta.includes("?") ? "&" : "?"}mock=${opciones.mock}` : ""}`;
  return new Request(url, { method: opciones.metodo ?? "GET", headers, body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo) });
}

const capitulo = (id: string, cap: string, op: Parameters<typeof pedir>[1] = {}) =>
  GETCapitulo(pedir(`/api/libros/${id}/capitulos/${cap}`, op), { params: Promise.resolve({ id, capituloId: cap }) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("API de libros", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("AUDITE_LIBROS_RUTA", FIXTURES);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://qdjowihivtqoelurvyke.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "super-secret-key");
    vi.stubEnv("AUDITE_MOSTRAR_AMAZON", "");
    doble.falloEstado = false;
    vaciarMemoria();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("catálogo: 3 volúmenes, completos primero, sin rutas ni Kindle ni texto", async () => {
    const r = await GETCatalogo();
    expect(r.headers.get("cache-control")).toBe("no-store");
    const cuerpo = await r.json() as { libros: { id: string; disponibilidad: string }[]; mostrar_amazon: boolean };
    expect(cuerpo.libros.map((l) => [l.id, l.disponibilidad])).toEqual([["libro-prueba", "lectura"], ["completo-sin-texto", "preparandose"], ["en-borrador", "borrador"]]);
    const texto = JSON.stringify(cuerpo);
    for (const secreto of ["no-debe-salir", "super-secret-key", "PRUEBAKINDLE", "amazon_kindle", PREMIUM, "TEXTO_ADELANTO_PRUEBA", "bloques"]) expect(texto).not.toContain(secreto);
    expect(cuerpo.mostrar_amazon).toBe(false);
    expect(texto).not.toContain("PRUEBA0001");
  });

  it("Amazon solo sale con el flag afirmativo y nunca el de Kindle", async () => {
    vi.stubEnv("AUDITE_MOSTRAR_AMAZON", "true");
    const texto = JSON.stringify(await (await GETCatalogo()).json());
    expect(texto).toContain("PRUEBA0001");
    expect(texto).not.toContain("PRUEBAKINDLE");
    vi.stubEnv("AUDITE_MOSTRAR_AMAZON", "quizá");
    expect(JSON.stringify(await (await GETCatalogo()).json())).not.toContain("PRUEBA0001");
  });

  it("ficha: índice completo y solo el prólogo, para cualquiera, incluso premium", async () => {
    for (const mock of [undefined, "premium"]) {
      const r = await GETLibro(pedir("/api/libros/libro-prueba", { mock }), ctx("libro-prueba"));
      const cuerpo = await r.json() as { lectura: { indice: { id: string }[]; capitulos: { id: string }[] } };
      expect(cuerpo.lectura.indice.map((i) => i.id)).toEqual(["prologo", "capitulo-01", "epilogo"]);
      expect(cuerpo.lectura.capitulos.map((c) => c.id)).toEqual(["prologo"]);
      const texto = JSON.stringify(cuerpo);
      expect(texto).not.toContain(PREMIUM);
      expect(texto).not.toContain(EPILOGO);
    }
  });

  it("ficha de un completo sin texto no inventa lectura; el borrador no se lee", async () => {
    const sin = await (await GETLibro(pedir("/api/libros/completo-sin-texto"), ctx("completo-sin-texto"))).json() as { ficha: { indice: unknown[] }; lectura: unknown };
    expect(sin.lectura).toBeNull();
    expect(sin.ficha.indice).toHaveLength(2);
    expect((await capitulo("completo-sin-texto", "prologo")).status).toBe(503);
    expect((await capitulo("en-borrador", "prologo")).status).toBe(404);
    expect((await GETLibro(pedir("/api/libros/..%2Fx"), ctx("../x"))).status).toBe(404);
  });

  it("capítulo de adelanto: 200 sin sesión", async () => {
    const r = await capitulo("libro-prueba", "prologo");
    expect(r.status).toBe(200);
    expect(JSON.stringify(await r.json())).toContain("TEXTO_ADELANTO_PRUEBA");
  });

  it("capítulo posterior sin sesión: 401 y ni rastro del texto", async () => {
    const r = await capitulo("libro-prueba", "capitulo-01");
    expect(r.status).toBe(401);
    const crudo = JSON.stringify(await r.json()) + JSON.stringify([...r.headers.entries()]);
    for (const prohibido of [PREMIUM, EPILOGO, "texto", "html", "bloques"]) expect(crudo).not.toContain(prohibido);
  });

  it("capítulo posterior con cuenta gratuita: 403 sin texto", async () => {
    const r = await capitulo("libro-prueba", "capitulo-01", { token: "tok-gratis" });
    expect(r.status).toBe(403);
    expect(JSON.stringify(await r.json())).not.toContain(PREMIUM);
    expect((await capitulo("libro-prueba", "epilogo", { mock: "gratis" })).status).toBe(403);
  });

  it("si falla la lectura de la suscripción, el autenticado queda como gratuito", async () => {
    doble.falloEstado = true;
    const r = await capitulo("libro-prueba", "capitulo-01", { token: "tok-premium" });
    expect(r.status).toBe(403);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect((await capitulo("libro-prueba", "capitulo-01", { token: "tok-premium" })).status).toBe(401);
  });

  it("token inválido: sin sesión", async () => {
    expect((await capitulo("libro-prueba", "capitulo-01", { token: "falso" })).status).toBe(401);
  });

  it("premium (token active): 200 con el capítulo", async () => {
    const r = await capitulo("libro-prueba", "capitulo-01", { token: "tok-premium" });
    expect(r.status).toBe(200);
    expect(JSON.stringify(await r.json())).toContain(PREMIUM);
    expect(r.headers.get("cache-control")).toBe("no-store");
  });

  it("capítulo inexistente: 404 sin tocar la sesión", async () => {
    expect((await capitulo("libro-prueba", "capitulo-99", { token: "tok-premium" })).status).toBe(404);
  });

  it("mock de desarrollo: query y cabecera", async () => {
    expect((await capitulo("libro-prueba", "capitulo-01", { mock: "premium" })).status).toBe(200);
    expect((await capitulo("libro-prueba", "capitulo-01", { cabeceraMock: "premium" })).status).toBe(200);
    expect((await capitulo("libro-prueba", "capitulo-01", { cabeceraMock: "sin" })).status).toBe(401);
    expect(await (await GETAcceso(pedir("/api/libros/acceso", { mock: "gratis" }))).json()).toEqual({ vista: "gratuito" });
    expect(await (await GETAcceso(pedir("/api/libros/acceso", { token: "tok-premium" }))).json()).toEqual({ vista: "premium" });
  });

  it("en producción se ignora el mock premium", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const porCabecera = await capitulo("libro-prueba", "capitulo-01", { cabeceraMock: "premium" });
    expect(porCabecera.status).toBe(401);
    const porQuery = await capitulo("libro-prueba", "capitulo-01", { mock: "premium" });
    expect(porQuery.status).toBe(401);
    expect(JSON.stringify(await porQuery.json())).not.toContain(PREMIUM);
    expect(await (await GETAcceso(pedir("/api/libros/acceso", { cabeceraMock: "premium" }))).json()).toEqual({ vista: "sin-sesion" });
    const anot = await POSTNotas(pedir("/api/libros/libro-prueba/notas", { metodo: "POST", cabeceraMock: "premium", cuerpo: { capitulo_id: "prologo", texto: "x" } }), ctx("libro-prueba"));
    expect(anot.status).toBe(401);
  });

  it("recomendaciones de episodio: propio primero, cruces después, sin borradores", async () => {
    const r = await GETEpisodios(pedir("/api/episodios/gn-01/libros"), { params: Promise.resolve({ episodeId: "gn-01" }) });
    const cuerpo = await r.json() as { libros: { id: string; motivo: string; capitulo_id: string | null }[] };
    expect(cuerpo.libros.map((l) => [l.id, l.motivo])).toEqual([["libro-prueba", "propio"], ["completo-sin-texto", "cruce"]]);
    expect(cuerpo.libros[0]?.capitulo_id).toBe("prologo");
    const texto = JSON.stringify(cuerpo);
    expect(texto).not.toContain(PREMIUM);
    expect(texto).not.toContain("en-borrador");
    expect((await GETEpisodios(pedir("/x"), { params: Promise.resolve({ episodeId: "../x" }) })).status).toBe(404);
  });

  it("anotaciones: 401 sin sesión, persisten en memoria con sesión", async () => {
    const sin = await PUTProgreso(pedir("/api/libros/libro-prueba/progreso", { metodo: "PUT", cuerpo: { capitulo_id: "prologo" } }), ctx("libro-prueba"));
    expect(sin.status).toBe(401);
    expect((await GETProgreso(pedir("/api/libros/libro-prueba/progreso"), ctx("libro-prueba"))).status).toBe(401);

    const op = { token: "tok-gratis" };
    const malo = await PUTProgreso(pedir("/api/libros/libro-prueba/progreso", { ...op, metodo: "PUT", cuerpo: { capitulo_id: "prologo", ratio: 3 } }), ctx("libro-prueba"));
    expect(malo.status).toBe(400);
    const ok = await PUTProgreso(pedir("/api/libros/libro-prueba/progreso", { ...op, metodo: "PUT", cuerpo: { capitulo_id: "prologo", bloque_id: "prologo-p-002", ratio: 0.4 } }), ctx("libro-prueba"));
    expect(ok.status).toBe(200);
    const leido = await (await GETProgreso(pedir("/api/libros/libro-prueba/progreso", op), ctx("libro-prueba"))).json() as { progreso: { bloque_id: string; ratio: number } };
    expect(leido.progreso).toMatchObject({ bloque_id: "prologo-p-002", ratio: 0.4 });

    const sub = await POSTSub(pedir("/api/libros/libro-prueba/subrayados", { ...op, metodo: "POST", cuerpo: { capitulo_id: "prologo", bloque_id: "prologo-p-001", inicio: 3, fin: 9 } }), ctx("libro-prueba"));
    expect(sub.status).toBe(201);
    const { item } = await sub.json() as { item: { id: string } };
    const nota = await POSTNotas(pedir("/api/libros/libro-prueba/notas", { ...op, metodo: "POST", cuerpo: { capitulo_id: "prologo", bloque_id: "prologo-p-001", subrayado_id: item.id, texto: "  Una nota breve  " } }), ctx("libro-prueba"));
    expect(nota.status).toBe(201);
    expect((await POSTNotas(pedir("/api/libros/libro-prueba/notas", { ...op, metodo: "POST", cuerpo: { capitulo_id: "prologo", texto: "" } }), ctx("libro-prueba"))).status).toBe(400);
    const notas = await (await GETNotas(pedir("/api/libros/libro-prueba/notas", op), ctx("libro-prueba"))).json() as { notas: { id: string; texto: string }[] };
    expect(notas.notas).toHaveLength(1);
    expect(notas.notas[0]?.texto).toBe("Una nota breve");

    // Cada cuenta ve lo suyo.
    const ajeno = await (await GETNotas(pedir("/api/libros/libro-prueba/notas", { token: "tok-premium" }), ctx("libro-prueba"))).json() as { notas: unknown[] };
    expect(ajeno.notas).toHaveLength(0);

    const borrada = await DELNotas(pedir(`/api/libros/libro-prueba/notas?id=${notas.notas[0]!.id}`, { ...op, metodo: "DELETE" }), ctx("libro-prueba"));
    expect(borrada.status).toBe(200);
    expect(((await (await GETNotas(pedir("/api/libros/libro-prueba/notas", op), ctx("libro-prueba"))).json()) as { notas: unknown[] }).notas).toHaveLength(0);
  });

  it("anotaciones de un libro inexistente: 404", async () => {
    expect((await GETNotas(pedir("/x", { token: "tok-gratis" }), ctx("no-existe"))).status).toBe(404);
  });
});
