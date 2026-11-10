import { describe, expect, it } from "vitest";
import { esquemaLanzamiento, esquemaLista, esquemaSoporte } from "./esquemas";

describe("validación zod", () => {
  it("acepta los tres formularios y rechaza el correo roto", () => {
    expect(esquemaSoporte.safeParse({ nombre: "Ana", correo: "ana@audite.tv", mensaje: "Hola", privacidad: "on" }).success).toBe(true);
    expect(esquemaSoporte.safeParse({ nombre: "Ana", correo: "no-es", mensaje: "Hola", privacidad: "on" }).success).toBe(false);
    expect(esquemaLista.safeParse({ correo: "ana@audite.tv", privacidad: "on" }).success).toBe(true);
    expect(esquemaLista.safeParse({ correo: "ana@audite.tv", privacidad: "" }).success).toBe(false);
    expect(esquemaLanzamiento.safeParse({ correo: "ana@audite.tv", privacidad: "on", plataforma: "ios" }).success).toBe(true);
    expect(esquemaLanzamiento.safeParse({ correo: "ana@audite.tv", privacidad: "on", plataforma: "web" }).success).toBe(false);
  });
});
