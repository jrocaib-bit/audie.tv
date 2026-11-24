/**
 * El repositorio es público. Ningún fichero versionado lleva texto de versículos.
 * Solo los ficheros `*.test.*` pueden llevar frases inventadas como fixture.
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
      if (textosLargos(contenido).length > 0) culpables.push(relativo);
    }
    expect(culpables).toEqual([]);
  });
});
