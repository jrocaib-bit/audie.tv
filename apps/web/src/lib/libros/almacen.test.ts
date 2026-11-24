import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FIXTURES = path.resolve(import.meta.dirname, "fixtures", "con-estanteria");
const FIRMA = "TOKEN_FIRMA_FALSO_123";

const doble = vi.hoisted(() => ({
  firmas: [] as { bucket: string; ruta: string; caducidad: number }[],
  errorFirma: null as null | { message: string; status?: number },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    storage: {
      from: (bucket: string) => ({
        createSignedUrl: async (ruta: string, caducidad: number) => {
          doble.firmas.push({ bucket, ruta, caducidad });
          if (doble.errorFirma) return { data: null, error: doble.errorFirma };
          return { data: { signedUrl: `https://almacen.test/firmada/${ruta}?token=${FIRMA}` }, error: null };
        },
      }),
    },
  }),
}));

import { NOMBRE_PORTADA, leerJsonLibros, leerPortada, origen, rutaJsonValida, vaciarCacheAlmacen, TTL_MS } from "./almacen";
import { cargarCatalogo, cargarTexto } from "./carga";
import { cargarEstanteria } from "./estanteria";

const BYTES = new Uint8Array([82, 73, 70, 70, 9, 8, 7]);
let peticiones: string[] = [];
let modoFetch: "ok" | "500" | "red" = "ok";

function fetchSimulado() {
  return vi.fn(async (entrada: string | URL | Request) => {
    const url = String(entrada);
    peticiones.push(url);
    if (modoFetch === "red") throw new Error(`fallo de red en ${url}`);
    if (modoFetch === "500") return new Response("error", { status: 500 });
    const ruta = new URL(url).pathname.replace("/firmada/", "");
    if (ruta.endsWith(".webp") || ruta.endsWith(".avif")) return new Response(BYTES, { status: 200 });
    try {
      return new Response(readFileSync(path.join(FIXTURES, ruta)), { status: 200 });
    } catch {
      return new Response("no", { status: 404 });
    }
  });
}

function bucket() {
  vi.stubEnv("AUDITE_LIBROS_RUTA", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proyecto.test");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "clave-de-servicio-falsa");
}

let avisos: string[] = [];
beforeEach(() => {
  vaciarCacheAlmacen();
  doble.firmas = [];
  doble.errorFirma = null;
  peticiones = [];
  modoFetch = "ok";
  avisos = [];
  vi.stubGlobal("fetch", fetchSimulado());
  for (const m of ["warn", "error", "log", "info"] as const) vi.spyOn(console, m).mockImplementation((...a: unknown[]) => void avisos.push(a.map(String).join(" ")));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("prioridad de orígenes", () => {
  it("la ruta local gana al bucket", async () => {
    bucket();
    vi.stubEnv("AUDITE_LIBROS_RUTA", FIXTURES);
    expect(origen()).toBe("local");
    expect(await cargarCatalogo()).not.toHaveLength(0);
    expect(doble.firmas).toHaveLength(0);
    expect(peticiones).toHaveLength(0);
  });

  it("sin ruta y con variables de Supabase usa el bucket, por defecto `libros`", async () => {
    bucket();
    expect(origen()).toBe("bucket");
    expect((await cargarCatalogo()).length).toBeGreaterThan(0);
    expect(doble.firmas.every((f) => f.bucket === "libros" && f.caducidad === 60)).toBe(true);
    vaciarCacheAlmacen();
    doble.firmas = [];
    vi.stubEnv("LIBROS_BUCKET", "otro");
    await leerJsonLibros("libros.json");
    expect(doble.firmas[0]?.bucket).toBe("otro");
  });

  it("sin nada devuelve el comportamiento sin libros", async () => {
    vi.stubEnv("AUDITE_LIBROS_RUTA", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(origen()).toBe("ninguno");
    expect(await cargarCatalogo()).toEqual([]);
    expect(await cargarTexto("libro-prueba")).toBeNull();
    expect(await cargarEstanteria()).toBeNull();
    expect(await leerPortada("lomo-01.webp")).toBeNull();
    expect(peticiones).toHaveLength(0);
  });

  it("con solo una de las dos variables de Supabase no hay bucket", () => {
    vi.stubEnv("AUDITE_LIBROS_RUTA", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proyecto.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(origen()).toBe("ninguno");
  });
});

describe("caché y TTL", () => {
  it("sirve de la caché y vuelve a pedir pasado el TTL", async () => {
    bucket();
    vi.useFakeTimers();
    await leerJsonLibros("libros.json");
    await leerJsonLibros("libros.json");
    expect(doble.firmas).toHaveLength(1);
    vi.advanceTimersByTime(TTL_MS - 1000);
    await leerJsonLibros("libros.json");
    expect(doble.firmas).toHaveLength(1);
    vi.advanceTimersByTime(2000);
    await leerJsonLibros("libros.json");
    expect(doble.firmas).toHaveLength(2);
  });

  it("deduplica peticiones simultáneas", async () => {
    bucket();
    const todos = await Promise.all(Array.from({ length: 8 }, () => leerJsonLibros("portadas/web/estanteria.json")));
    expect(doble.firmas).toHaveLength(1);
    expect(peticiones).toHaveLength(1);
    expect(todos.every((t) => t === todos[0])).toBe(true);
  });

  it("los fallos se recuerdan poco tiempo y luego se reintenta", async () => {
    bucket();
    vi.useFakeTimers();
    modoFetch = "500";
    expect(await leerJsonLibros("libros.json")).toBeNull();
    expect(await leerJsonLibros("libros.json")).toBeNull();
    expect(doble.firmas).toHaveLength(1);
    modoFetch = "ok";
    vi.advanceTimersByTime(31_000);
    expect(await leerJsonLibros("libros.json")).not.toBeNull();
  });
});

describe("nombres inválidos", () => {
  it("solo acepta rutas de las listas permitidas", async () => {
    bucket();
    for (const malo of [
      "../libros.json", "json/../libros.json", "json/../../x.json", "json/Libro.json", "json/a/b.json", "/libros.json", "libros.json\n",
      "secretos.json", "json/.json", "json/x.txt", "portadas/web/otra.json", "prueba/%2e%2e.json", "json/a b.json", "",
    ]) {
      expect(rutaJsonValida(malo), malo).toBeNull();
      expect(await leerJsonLibros(malo), malo).toBeNull();
    }
    expect(doble.firmas).toHaveLength(0);
    expect(await cargarTexto("../x")).toBeNull();
    expect(await cargarTexto("A")).toBeNull();
    for (const malo of ["../lomo-01.webp", "lomo-17.webp", "Lomo-01.webp", "lomo-01.png", "estanteria.json", "lomo-01.webp/../x"]) {
      expect(NOMBRE_PORTADA.test(malo), malo).toBe(false);
      expect(await leerPortada(malo), malo).toBeNull();
    }
    expect(doble.firmas).toHaveLength(0);
  });

  it("construye el objeto solo con el patrón permitido", async () => {
    bucket();
    await leerPortada("cubierta-03-960.avif");
    await cargarTexto("libro-prueba");
    expect(doble.firmas.map((f) => f.ruta)).toEqual(["portadas/web/cubierta-03-960.avif", "prueba/libro-prueba.json"]);
  });
});

describe("caída segura", () => {
  const casos: [string, () => void][] = [
    ["error de red", () => (modoFetch = "red")],
    ["respuesta 5xx", () => (modoFetch = "500")],
    ["error al firmar", () => (doble.errorFirma = { message: "internal", status: 500 })],
  ];
  for (const [nombre, preparar] of casos) {
    it(`${nombre}: sin libros, sin romper y sin datos sensibles en el aviso`, async () => {
      bucket();
      preparar();
      expect(await cargarCatalogo()).toEqual([]);
      expect(await cargarEstanteria()).toBeNull();
      expect(await leerPortada("lomo-01.webp")).toBeNull();
      expect(avisos.length).toBeGreaterThan(0);
      const todo = avisos.join("\n");
      for (const prohibido of [FIRMA, "almacen.test", "https://", "clave-de-servicio-falsa", "proyecto.test"]) expect(todo).not.toContain(prohibido);
    });
  }

  it("un objeto que no existe no genera aviso", async () => {
    bucket();
    doble.errorFirma = { message: "Object not found", status: 400 };
    expect(await leerJsonLibros("libros.json")).toBeNull();
    expect(avisos).toHaveLength(0);
  });

  it("JSON roto cae a sin libros", async () => {
    bucket();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{ no es json", { status: 200 })));
    expect(await leerJsonLibros("libros.json")).toBeNull();
  });
});

describe("portadas desde el bucket", () => {
  it("devuelve bytes y un ETag estable", async () => {
    bucket();
    const a = await leerPortada("lomo-01.webp");
    const b = await leerPortada("lomo-01.webp");
    expect(Array.from(a!.datos)).toEqual(Array.from(BYTES));
    expect(a!.etag).toMatch(/^"[0-9a-f]+-[0-9a-f]+"$/);
    expect(b!.etag).toBe(a!.etag);
  });
});
