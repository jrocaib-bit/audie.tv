import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { sincronizar } from "./sync";

const minimo = {
  version: 1,
  actualizado: "2026-11-09",
  idiomas: ["es"],
  libros: [
    {
      id: "gn",
      orden: 1,
      testamento: "AT",
      titulo: { es: "Génesis", en: "Genesis" },
      episodios: [{ id: "gn-01", orden: 1, idiomas: { es: { estado: "listo_voz" } } }],
    },
  ],
};

describe("sincronizar contenido", () => {
  it("copia una carpeta o un zip y no marca nada como reproducible", () => {
    const raiz = mkdtempSync(path.join(os.tmpdir(), "audite-origen-"));
    const destino = mkdtempSync(path.join(os.tmpdir(), "audite-destino-"));
    mkdirSync(path.join(raiz, "01_canon"), { recursive: true });
    writeFileSync(path.join(raiz, "01_canon/manifiesto.json"), JSON.stringify(minimo));
    const carpeta = sincronizar(raiz, destino);
    expect(carpeta.ok).toBe(true);
    expect(carpeta.reproducibles).toEqual([]);
    expect(JSON.parse(readFileSync(path.join(destino, "catalogo-indice.json"), "utf8")).episodes).toEqual([]);

    const empaquetado = mkdtempSync(path.join(os.tmpdir(), "audite-pack-"));
    const zip = path.join(empaquetado, "audite.zip");
    const packed = spawnSync("zip", ["-qr", zip, "01_canon"], { cwd: raiz });
    expect(packed.status).toBe(0);
    const otro = mkdtempSync(path.join(os.tmpdir(), "audite-desde-zip-"));
    const archivo = sincronizar(zip, otro);
    expect(archivo.ok).toBe(true);
    expect(archivo.copiados).toContain("01_canon/manifiesto.json");
    rmSync(raiz, { recursive: true, force: true });
    rmSync(destino, { recursive: true, force: true });
    rmSync(empaquetado, { recursive: true, force: true });
    rmSync(otro, { recursive: true, force: true });
  });
});
