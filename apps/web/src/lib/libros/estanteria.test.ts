import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cargarEstanteria, validarEstanteria, validarVolumen } from "./estanteria";

const FIXTURES = path.resolve(import.meta.dirname, "fixtures", "con-estanteria");
const volumenBueno = {
  volumen: 4, id: "cuarto", libro: "L", titulo: "T", subtitulo: "S", rotulo: "R", color: "#112233", sinopsis: "Una frase.",
  credito_obra: "C", borrador: false, episodios_total: 1, episodios_destacados: [{ episodio_id: "ep-1", etiqueta: "L 1–2", titulo: "X" }],
};

afterEach(() => vi.unstubAllEnvs());

describe("cargarEstanteria", () => {
  it("devuelve null sin ruta configurada", () => {
    vi.stubEnv("AUDITE_LIBROS_RUTA", "");
    expect(cargarEstanteria()).toBeNull();
  });

  it("devuelve null si falta el archivo", () => {
    const vacio = mkdtempSync(path.join(os.tmpdir(), "estanteria-"));
    vi.stubEnv("AUDITE_LIBROS_RUTA", vacio);
    expect(cargarEstanteria()).toBeNull();
    rmSync(vacio, { recursive: true, force: true });
  });

  it("devuelve null con JSON roto", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "estanteria-"));
    mkdirSync(path.join(dir, "portadas", "web"), { recursive: true });
    writeFileSync(path.join(dir, "portadas", "web", "estanteria.json"), "{ no es json");
    vi.stubEnv("AUDITE_LIBROS_RUTA", dir);
    expect(cargarEstanteria()).toBeNull();
    rmSync(dir, { recursive: true, force: true });
  });

  it("lee el fixture de 3 volúmenes, en orden, unido al catálogo por id", () => {
    vi.stubEnv("AUDITE_LIBROS_RUTA", FIXTURES);
    const lista = cargarEstanteria();
    expect(lista?.map((v) => v.volumen)).toEqual([1, 2, 3]);
    expect(lista?.map((v) => v.disponibilidad)).toEqual(["lectura", "preparandose", "borrador"]);
    expect(lista?.[0]?.episodios_destacados.map((e) => e.etiqueta)).toEqual(["Primero 1 a 2", "Primero 3"]);
    expect(lista?.[1]?.credito_obra).not.toMatch(/[;–—]/);
  });

  it("un id fuera del catálogo queda como preparándose, y un borrador marcado en el JSON no ofrece lectura", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "estanteria-"));
    mkdirSync(path.join(dir, "portadas", "web"), { recursive: true });
    writeFileSync(path.join(dir, "portadas", "web", "estanteria.json"), JSON.stringify({ volumenes: [volumenBueno, { ...volumenBueno, volumen: 5, id: "quinto", borrador: true }] }));
    vi.stubEnv("AUDITE_LIBROS_RUTA", dir);
    expect(cargarEstanteria()?.map((v) => v.disponibilidad)).toEqual(["preparandose", "borrador"]);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("validación", () => {
  it("acepta un volumen bien formado", () => {
    expect(validarVolumen(volumenBueno)?.id).toBe("cuarto");
    expect(validarVolumen(volumenBueno)?.episodios_destacados[0]?.etiqueta).toBe("L 1 a 2");
  });

  it("rechaza formas inválidas", () => {
    for (const malo of [
      null, "x", [], {},
      { ...volumenBueno, volumen: 0 },
      { ...volumenBueno, volumen: 17 },
      { ...volumenBueno, volumen: 1.5 },
      { ...volumenBueno, id: "../x" },
      { ...volumenBueno, id: "Mayusculas" },
      { ...volumenBueno, color: "rojo" },
      { ...volumenBueno, titulo: "" },
      { ...volumenBueno, borrador: "no" },
      { ...volumenBueno, episodios_total: -1 },
      { ...volumenBueno, episodios_destacados: "x" },
      { ...volumenBueno, episodios_destacados: [1, 2, 3, 4].map((n) => ({ episodio_id: `e-${n}`, etiqueta: "", titulo: "" })) },
      { ...volumenBueno, episodios_destacados: [{ episodio_id: "../e", etiqueta: "", titulo: "" }] },
    ]) {
      expect(validarVolumen(malo)).toBeNull();
    }
  });

  it("descarta lo inválido y repetido, y devuelve null si no queda nada", () => {
    expect(validarEstanteria(null)).toBeNull();
    expect(validarEstanteria({})).toBeNull();
    expect(validarEstanteria({ volumenes: "x" })).toBeNull();
    expect(validarEstanteria({ volumenes: [] })).toBeNull();
    expect(validarEstanteria({ volumenes: [{ ...volumenBueno, volumen: 99 }] })).toBeNull();
    expect(validarEstanteria({ volumenes: Array.from({ length: 17 }, () => volumenBueno) })).toBeNull();
    const lista = validarEstanteria({ volumenes: [volumenBueno, volumenBueno, { ...volumenBueno, volumen: 2, id: "segundo" }, { basura: true }] });
    expect(lista?.map((v) => v.volumen)).toEqual([2, 4]);
  });
});
