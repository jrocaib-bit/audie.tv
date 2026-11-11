import { describe, expect, it } from "vitest";
import { ETIQUETA_LANZAMIENTO, etiquetaDeLanzamiento, pideSuscripcion, precioLanzamientoActivo } from "./precio";

describe("precio de lanzamiento", () => {
  it("está apagado salvo que el flag sea exactamente true", () => {
    expect(precioLanzamientoActivo(undefined)).toBe(false);
    expect(precioLanzamientoActivo("")).toBe(false);
    expect(precioLanzamientoActivo("false")).toBe(false);
    expect(precioLanzamientoActivo("true")).toBe(true);
    expect(etiquetaDeLanzamiento("es", false)).toBeNull();
    expect(etiquetaDeLanzamiento("es", true)).toBe(ETIQUETA_LANZAMIENTO);
    expect(etiquetaDeLanzamiento("es", true)).toBe("Precio de lanzamiento hasta el 6 de enero");
  });

  it("Adviento no pide suscripción", () => {
    expect(pideSuscripcion("adviento-isaias")).toBe(false);
    expect(pideSuscripcion("cuaresma-40")).toBe(true);
    expect(pideSuscripcion(null)).toBe(true);
  });
});
