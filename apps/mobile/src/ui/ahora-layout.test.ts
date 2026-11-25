import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { altoCabeceraAhora, altoControlesAhora, altoMaxCarrusel } from "./ahora-layout";

const leer = (ruta: string) => readFileSync(path.resolve(import.meta.dirname, ruta), "utf8");

/** Cálculo anterior: reservaba 470 px y forzaba un mínimo de 200, sin la fila del rótulo. */
function altoMaxCarruselAnterior({ height, top, bottom }: { height: number; top: number; bottom: number }): number {
  return Math.max(200, height - top - bottom - 470);
}

const DISPOSITIVOS = [
  { nombre: "iPhone SE", width: 375, height: 667, top: 20, bottom: 0 },
  { nombre: "iPhone 14", width: 390, height: 844, top: 47, bottom: 34 },
  { nombre: "iPhone 16 Pro Max", width: 430, height: 932, top: 59, bottom: 34 },
] as const;

describe("altoMaxCarrusel", () => {
  it.each(DISPOSITIVOS)("en $nombre el carrusel cabe bajo el rótulo y deja los controles enteros", (dispositivo) => {
    const alto = altoMaxCarrusel(dispositivo);
    const ocupado = altoCabeceraAhora(dispositivo.top) + alto + altoControlesAhora(dispositivo.bottom);
    expect(alto).toBeGreaterThan(120);
    expect(ocupado).toBe(dispositivo.height);
  });

  it.each(DISPOSITIVOS)("en $nombre el cálculo anterior se come el rótulo con un título a dos líneas", (dispositivo) => {
    const anterior = altoMaxCarruselAnterior(dispositivo);
    const ocupado = altoCabeceraAhora(dispositivo.top) + anterior + altoControlesAhora(dispositivo.bottom);
    expect(ocupado).toBeGreaterThan(dispositivo.height);
  });
});

describe("pantalla Ahora suena", () => {
  const fuente = leer("../app/ahora.tsx");

  it("usa el alto medido del hueco y mantiene el rótulo por encima del carrusel", () => {
    expect(fuente).toContain("altoMaxCarrusel");
    expect(fuente).toContain("setHuecoAlto");
    expect(fuente).toContain("zIndex: 2");
    expect(fuente).toContain("MARGEN_BAJO_ROTULO");
    expect(fuente).toContain("overflow: \"hidden\"");
    expect(fuente).not.toContain("ventana.height - insets.top - insets.bottom - 470");
    expect(fuente).not.toContain("Math.max(200,");
  });
});
