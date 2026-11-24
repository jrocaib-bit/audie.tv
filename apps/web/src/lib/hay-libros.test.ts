import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { hayIndiceLibros, RUTA_LIBROS } from "./hay-libros";

describe("hayIndiceLibros", () => {
  it("en este árbol no hay índice de libros, así que la entrada no se muestra", () => {
    expect(hayIndiceLibros()).toBe(false);
    expect(RUTA_LIBROS).toBe("/libros");
  });
  it("si existe la página /[lang]/libros, la ruta se considera activa", () => {
    const raiz = mkdtempSync(path.join(tmpdir(), "audite-libros-"));
    try {
      const dest = path.join(raiz, "src/app/[lang]/libros");
      mkdirSync(dest, { recursive: true });
      writeFileSync(path.join(dest, "page.tsx"), "export default function Page() { return null; }\n");
      expect(hayIndiceLibros(raiz)).toBe(true);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });
});
