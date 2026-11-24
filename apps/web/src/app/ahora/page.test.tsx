import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { renderToString } from "react-dom/server";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { LibraryProvider } from "@/components/library";
import Page from "./page";

// Frase inventada que solo existe en el fichero temporal.
const FRASE = "Frase inventada que nunca debe viajar en el HTML.";
const raiz = mkdtempSync(path.join(tmpdir(), "audite-texto-html-"));
mkdirSync(path.join(raiz, "es"), { recursive: true });
writeFileSync(
  path.join(raiz, "es", "gn-01.json"),
  JSON.stringify({ version: 1, episodio: "gn-01", idioma: "es", muestra: true, fuente: "Fuente inventada", credito: "Crédito inventado", versiculos: [{ ref: "1,1", cap: 1, v: "1", texto: FRASE, t: 0 }] }),
);

function html(): string {
  vi.stubEnv("AUDITE_DEMO", "1");
  const catalog = loadAppCatalog();
  return renderToString(<LibraryProvider catalog={catalog}><Page /></LibraryProvider>);
}

describe("página del reproductor", () => {
  afterEach(() => vi.unstubAllEnvs());
  afterAll(() => rmSync(raiz, { recursive: true, force: true }));

  it("con la función encendida, el texto se pide a la API y no va en el HTML", () => {
    vi.stubEnv("TEXTO_BIBLICO_ACTIVO", "1");
    vi.stubEnv("TEXTO_ACCESO", "abierto");
    vi.stubEnv("AUDITE_TEXTO_RUTA", raiz);
    const pagina = html();
    expect(pagina).toContain("Texto del episodio");
    expect(pagina).toContain("Cargando el texto");
    expect(pagina).not.toContain(FRASE);
    expect(pagina).not.toContain(raiz);
  });

  it("con la función apagada no pinta nada del panel", () => {
    vi.stubEnv("TEXTO_BIBLICO_ACTIVO", "");
    vi.stubEnv("AUDITE_TEXTO_RUTA", raiz);
    const pagina = html();
    expect(pagina).not.toContain("Texto del episodio");
    expect(pagina).not.toContain("Cargando el texto");
    expect(pagina).not.toContain(FRASE);
  });
});
