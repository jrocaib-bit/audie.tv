import { describe, expect, it } from "vitest";
import { PRECIO, type Disponibilidad, type VistaLector } from "@audite/domain";
import { botonesFicha } from "./botones-ficha";

const resumen = (vista: VistaLector | null, disp: Disponibilidad, progreso = false) =>
  botonesFicha(vista, disp, { progreso }).map((b) => `${b.accion}:${b.nivel}:${b.etiqueta}`);

describe("botonesFicha", () => {
  it("sin sesión: adelanto, prueba y Entrar", () => {
    expect(resumen("sin-sesion", "lectura")).toEqual([
      "leer:primario:Leer el adelanto",
      `prueba:secundario:Prueba ${PRECIO.pruebaDias} días gratis`,
      "entrar:enlace:Entrar",
    ]);
  });

  it("gratuito: adelanto y Hazte premium, sin Entrar", () => {
    expect(resumen("gratuito", "lectura")).toEqual(["leer:primario:Leer el adelanto", "premium:secundario:Hazte premium"]);
  });

  it("premium: solo Leer, o Seguir leyendo con progreso", () => {
    expect(resumen("premium", "lectura")).toEqual(["leer:primario:Leer"]);
    expect(resumen("premium", "lectura", true)).toEqual(["leer:primario:Seguir leyendo"]);
  });

  it("mientras no se sabe el estado solo hay adelanto", () => {
    expect(resumen(null, "lectura")).toEqual(["leer:primario:Leer el adelanto"]);
  });

  it("sin lectura disponible no hay ningún botón, sea cual sea el estado", () => {
    for (const vista of [null, "sin-sesion", "gratuito", "premium"] as const) {
      expect(resumen(vista, "borrador")).toEqual([]);
      expect(resumen(vista, "preparandose")).toEqual([]);
    }
  });

  it("Entrar solo sin sesión y nunca hay CTA de suscripción en premium", () => {
    const todas = (["sin-sesion", "gratuito", "premium", null] as const).map((v) => [v, botonesFicha(v, "lectura")] as const);
    for (const [vista, botones] of todas) {
      expect(botones.some((b) => b.accion === "entrar")).toBe(vista === "sin-sesion");
      if (vista === "premium") expect(botones.some((b) => b.accion === "prueba" || b.accion === "premium")).toBe(false);
      expect(botones.filter((b) => b.nivel === "primario")).toHaveLength(1);
    }
  });
});
