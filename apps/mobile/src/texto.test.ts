import { describe, expect, it, vi } from "vitest";
import { cargarTexto, urlTexto } from "./texto";

// Texto inventado. Nunca un pasaje real.
const TEXTO = {
  version: 1,
  episodio: "gn-01",
  idioma: "es",
  muestra: true,
  fuente: "Fuente inventada",
  credito: "Crédito inventado",
  versiculos: [{ ref: "1,1", cap: 1, v: "1", texto: "Frase inventada para la app.", t: 0 }],
};

function respuesta(estado: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), { status: estado, headers: { "content-type": "application/json" } });
}

describe("texto en la app", () => {
  it("construye la URL de la API y rechaza ids inválidos", () => {
    expect(urlTexto("http://127.0.0.1:43123/", "gn-01", "es")).toBe("http://127.0.0.1:43123/api/texto/gn-01?lang=es");
    expect(urlTexto("http://x", "../etc", "es")).toBeNull();
  });

  it("manda el token de la sesión y lee el texto", async () => {
    const pedir = vi.fn(async () => respuesta(200, TEXTO));
    const carga = await cargarTexto({ base: "http://x", id: "gn-01", idioma: "es", token: "tok", pedir: pedir as unknown as typeof fetch });
    expect(carga.tipo).toBe("listo");
    const [, init] = pedir.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("sin sesión no manda cabecera", async () => {
    const pedir = vi.fn(async () => respuesta(401, { error: "sin-sesion" }));
    const carga = await cargarTexto({ base: "http://x", id: "gn-01", idioma: "es", token: null, pedir: pedir as unknown as typeof fetch });
    expect(carga.tipo).toBe("sin-sesion");
    const [, init] = pedir.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("traduce los estados de la API", async () => {
    const con = (estado: number, cuerpo: unknown) => cargarTexto({ base: "http://x", id: "gn-01", idioma: "es", token: "t", pedir: (async () => respuesta(estado, cuerpo)) as unknown as typeof fetch });
    expect((await con(403, { error: "sin-permiso" })).tipo).toBe("sin-permiso");
    expect((await con(404, { error: "no-encontrado" })).tipo).toBe("apagado");
    expect((await con(404, { error: "sin-texto" })).tipo).toBe("sin-texto");
    expect((await con(200, { roto: true })).tipo).toBe("error");
    const caida = await cargarTexto({ base: "http://x", id: "gn-01", idioma: "es", token: null, pedir: (async () => { throw new Error("red"); }) as unknown as typeof fetch });
    expect(caida.tipo).toBe("error");
  });
});
