import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FUENTES_GAZPACHO, cssGazpacho, prepararFuentes } from "../../../../scripts/fetch-fonts.mjs";

const raiz = path.resolve(import.meta.dirname, "../../../..");
const regular = FUENTES_GAZPACHO[0]!;
const heavy = FUENTES_GAZPACHO[1]!;

describe("gazpacho", () => {
  it("avisa si faltan variables o la descarga falla y no escribe fuentes", async () => {
    let escrito = false;
    const sinClave = await prepararFuentes({
      supabaseUrl: "https://fuentes.test",
      serviceRole: "",
      fetch: async () => { throw new Error("no"); },
      sha256: () => regular.sha256,
      write: async () => { escrito = true; },
    });
    expect(sinClave).toEqual({ estado: "reserva", aviso: "sin-variables" });
    const caida = await prepararFuentes({
      supabaseUrl: "https://fuentes.test",
      serviceRole: "clave-de-prueba",
      fetch: async () => { throw new Error("red"); },
      sha256: () => regular.sha256,
      write: async () => { escrito = true; },
    });
    expect(caida).toEqual({ estado: "reserva", aviso: "descarga" });
    expect(escrito).toBe(false);
  });

  it("solo escribe los dos woff2 si el sha256 coincide", async () => {
    const nombres: string[] = [];
    const cuerpos = new Map<string, Buffer>([
      [regular.ruta, Buffer.from("regular")],
      [heavy.ruta, Buffer.from("heavy")],
    ]);
    const resultado = await prepararFuentes({
      supabaseUrl: "https://fuentes.test",
      serviceRole: "clave-de-prueba",
      fetch: async (url: string) => {
        const ruta = url.split("/fuentes/")[1] ?? "";
        const bytes = cuerpos.get(ruta);
        if (!bytes) return { ok: false, arrayBuffer: async () => new ArrayBuffer(0) };
        return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
      },
      sha256: (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex") === createHash("sha256").update(cuerpos.get(regular.ruta)!).digest("hex")
        ? regular.sha256
        : heavy.sha256,
      write: async (archivos: { nombre: string }[], css: string) => {
        nombres.push(...archivos.map((archivo) => archivo.nombre));
        expect(css).toBe(cssGazpacho());
      },
    });
    expect(resultado.estado).toBe("listo");
    expect(nombres).toEqual(["Gazpacho-Regular.woff2", "Gazpacho-Heavy.woff2"]);
    expect(cssGazpacho()).toContain("font-weight:400");
    expect(cssGazpacho()).toContain("font-weight:900");
    expect(cssGazpacho()).not.toContain(".otf");
    const fuente = readFileSync(path.join(raiz, "scripts/fetch-fonts.mjs"), "utf8");
    expect(fuente).not.toMatch(/console\.(log|warn|error)\([^)]*serviceRole|console\.(log|warn|error)\([^)]*SUPABASE_SERVICE_ROLE_KEY/);
    expect(fuente).not.toMatch(/git add/);
  });

  it("rechaza un sha256 que no coincide y no escribe", async () => {
    let escrito = false;
    const resultado = await prepararFuentes({
      supabaseUrl: "https://fuentes.test",
      serviceRole: "clave-de-prueba",
      fetch: async () => ({ ok: true, arrayBuffer: async () => new Uint8Array([1]).buffer }),
      sha256: () => "0".repeat(64),
      write: async () => { escrito = true; },
    });
    expect(resultado).toEqual({ estado: "reserva", aviso: "sha256" });
    expect(escrito).toBe(false);
  });

  it("no rastrea otf ni woff2 de Gazpacho en git", () => {
    const lista = execFileSync("git", ["ls-files"], { cwd: raiz, encoding: "utf8" });
    const rastreados = lista.split("\n").filter((linea) => /gazpacho/i.test(linea) && /\.(otf|woff2)$/i.test(linea));
    expect(rastreados).toEqual([]);
    const ignorados = readFileSync(path.join(raiz, ".gitignore"), "utf8");
    expect(ignorados).toContain("apps/web/public/fonts/gazpacho");
  });
});
