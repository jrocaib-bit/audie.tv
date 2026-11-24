import { describe, expect, it } from "vitest";
import { ETIQUETA_LANZAMIENTO, LETRA_LANZAMIENTO, PRECIO_ANUAL_SIGUIENTE, accesosAdviento, etiquetaDeLanzamiento, hrefDePasoAdviento, letraDeLanzamiento, pideSuscripcion, precioDeSuscripcion, precioLanzamientoActivo } from "./precio";

describe("precio de lanzamiento", () => {
  it("está apagado salvo que el flag sea exactamente true", () => {
    expect(precioLanzamientoActivo(undefined)).toBe(false);
    expect(precioLanzamientoActivo("")).toBe(false);
    expect(precioLanzamientoActivo("false")).toBe(false);
    expect(precioLanzamientoActivo("true")).toBe(true);
    expect(etiquetaDeLanzamiento("es", false)).toBeNull();
    expect(letraDeLanzamiento("es", false)).toBeNull();
    expect(letraDeLanzamiento("en", false)).toBeNull();
    expect(etiquetaDeLanzamiento("es", true)).toBe(ETIQUETA_LANZAMIENTO);
    expect(etiquetaDeLanzamiento("es", true)).toBe("Precio de lanzamiento hasta el 5 de enero");
    expect(etiquetaDeLanzamiento("en", true)).toBe("Launch price until 5 January");
    expect(letraDeLanzamiento("es", true)).toBe(LETRA_LANZAMIENTO);
    expect(letraDeLanzamiento("es", true)).toBe("Si te suscribes antes del 6 de enero, pagarás 8 € al año mientras mantengas tu suscripción activa.");
    expect(PRECIO_ANUAL_SIGUIENTE).toBe("12,99 €");
  });

  it("cambia el anual nuevo a las 00:00 del 6 de enero de 2027 en Madrid", () => {
    const víspera = new Date("2027-01-05T22:59:00Z");
    const corte = new Date("2027-01-05T23:00:00Z");
    expect(precioDeSuscripcion("mensual", corte, "nuevo")).toBe("1,99 € al mes");
    expect(precioDeSuscripcion("anual", víspera, "nuevo")).toBe("8,00 € al año");
    expect(precioDeSuscripcion("anual", corte, "nuevo")).toBe("12,99 € al año");
    expect(precioDeSuscripcion("anual", new Date("2027-06-01T12:00:00Z"), "vigente")).toBe("8,00 € al año");
    expect(precioDeSuscripcion("anual", new Date("2026-12-31T23:00:00Z"), "nuevo")).toBe("8,00 € al año");
  });

  it("Adviento no pide suscripción", () => {
    expect(pideSuscripcion("adviento-isaias")).toBe(false);
    expect(pideSuscripcion("cuaresma-40")).toBe(true);
    expect(pideSuscripcion(null)).toBe(true);
  });

  it("los 26 pasos de Adviento piden cuenta y nunca suscripción ni prueba", () => {
    const dias = Array.from({ length: 26 }, (_, indice) => indice + 1);
    const sinCuenta = accesosAdviento(false, dias);
    const conCuenta = accesosAdviento(true, dias);
    expect(sinCuenta).toHaveLength(26);
    expect(new Set(sinCuenta)).toEqual(new Set(["entrar"]));
    expect(new Set(conCuenta)).toEqual(new Set(["oir"]));
    expect([...sinCuenta, ...conCuenta].join(" ")).not.toMatch(/suscripcion|prueba/);
    expect(hrefDePasoAdviento(false, "/ahora?e=is-02", "/entrar")).toBe("/entrar");
    expect(hrefDePasoAdviento(true, "/ahora?e=is-02", "/entrar")).toBe("/ahora?e=is-02");
  });
});
