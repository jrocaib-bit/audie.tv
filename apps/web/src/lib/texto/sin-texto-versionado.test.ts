/**
 * El repositorio es público. Ningún fichero versionado lleva texto de versículos.
 * Solo los ficheros `*.test.*` pueden llevar frases inventadas como fixture.
 * Única excepción: `content/texto/torres-amat/es/*.json`, el texto de Torres Amat (siglo XIX, dominio público).
 * Cada fichero de esa carpeta debe declarar `fuente: "torres-amat"` y `muestra: false`. Cualquier otro fichero con
 * versículos largos, o uno de esa carpeta con otra fuente, falla.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const LIMITE = 30;
const CAMPO_TEXTO = /["']?texto["']?\s*:\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;

function raiz(): string {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: __dirname, encoding: "utf8" }).trim();
}

function versionados(base: string): string[] {
  return execFileSync("git", ["ls-files", "-z"], { cwd: base, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    .split("\0")
    .filter(Boolean);
}

const CARPETA_DOMINIO_PUBLICO = /^content\/texto\/torres-amat\/es\/[a-z0-9-]+\.json$/;

/** Cierto si el fichero es de la carpeta de dominio público y declara la fuente Torres Amat sin ser muestra. */
export function esDominioPublicoDeclarado(relativo: string, contenido: string): boolean {
  if (!CARPETA_DOMINIO_PUBLICO.test(relativo)) return false;
  try {
    const dato = JSON.parse(contenido) as { fuente?: unknown; muestra?: unknown };
    return dato.fuente === "torres-amat" && dato.muestra === false;
  } catch {
    return false;
  }
}

export function textosLargos(contenido: string): string[] {
  if (!contenido.includes('"versiculos"')) return [];
  const hallados: string[] = [];
  for (const coincidencia of contenido.matchAll(CAMPO_TEXTO)) {
    const valor = coincidencia[2] ?? "";
    if (valor.length > LIMITE) hallados.push(valor.slice(0, 20));
  }
  return hallados;
}

describe("texto bíblico fuera del repositorio", () => {
  it("detecta un campo texto largo junto a versiculos", () => {
    expect(textosLargos('{"versiculos":[{"texto":"Frase inventada que pasa de treinta caracteres."}]}')).toHaveLength(1);
    expect(textosLargos('{"versiculos":[{"texto":"..."}]}')).toHaveLength(0);
    expect(textosLargos('{"texto":"Frase inventada que pasa de treinta caracteres."}')).toHaveLength(0);
  });

  it("solo acepta la carpeta de Torres Amat con su fuente declarada", () => {
    const bueno = '{"fuente":"torres-amat","muestra":false,"versiculos":[]}';
    expect(esDominioPublicoDeclarado("content/texto/torres-amat/es/gn-01.json", bueno)).toBe(true);
    expect(esDominioPublicoDeclarado("content/texto/otra/es/gn-01.json", bueno)).toBe(false);
    expect(esDominioPublicoDeclarado("content/texto/torres-amat/es/gn-01.json", '{"fuente":"cee","muestra":false}')).toBe(false);
    expect(esDominioPublicoDeclarado("content/texto/torres-amat/es/gn-01.json", '{"fuente":"torres-amat","muestra":true}')).toBe(false);
    expect(esDominioPublicoDeclarado("apps/web/gn-01.json", bueno)).toBe(false);
  });

  it("ningún fichero versionado fuera de los tests lleva versiculos con texto largo", () => {
    const base = raiz();
    const culpables: string[] = [];
    for (const relativo of versionados(base)) {
      if (/\.test\.[^/]+$/.test(relativo)) continue;
      const ruta = path.join(base, relativo);
      let contenido: string;
      try {
        if (!statSync(ruta).isFile() || statSync(ruta).size > 20 * 1024 * 1024) continue;
        contenido = readFileSync(ruta, "utf8");
      } catch {
        continue;
      }
      if (contenido.includes("\0")) continue;
      if (esDominioPublicoDeclarado(relativo, contenido)) continue;
      if (textosLargos(contenido).length > 0) culpables.push(relativo);
    }
    expect(culpables).toEqual([]);
  });
});
