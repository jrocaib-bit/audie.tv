import { describe, expect, it } from "vitest";
import { decidirReproduccion, esGratisConCuenta, idsGratisConCuenta, pendienteListo, tipoAcceso } from "./acceso";

describe("acceso en la app", () => {
  it("gn-01 y el Adviento son gratis con cuenta; el resto, Premium", () => {
    expect(esGratisConCuenta("gn-01")).toBe(true);
    expect(esGratisConCuenta("is-01")).toBe(true);
    expect(esGratisConCuenta("gn-02")).toBe(false);
    expect(idsGratisConCuenta().size).toBeGreaterThan(10);
  });
  it("marca de las listas", () => {
    expect(tipoAcceso("gn-01", true)).toBe("gratis");
    expect(tipoAcceso("gn-02", true)).toBe("premium");
    expect(tipoAcceso("gn-02", false)).toBe("proximamente");
    expect(tipoAcceso("gn-01", false)).toBe("proximamente");
  });
  it("sin sesión todo pide cuenta, también lo gratis", () => {
    expect(decidirReproduccion({ id: "gn-01", grabado: true, haySesion: false })).toBe("cuenta");
    expect(decidirReproduccion({ id: "gn-02", grabado: true, haySesion: false })).toBe("cuenta");
    expect(decidirReproduccion({ id: "is-03", grabado: true, haySesion: false })).toBe("cuenta");
  });
  it("con sesión: gratis suena, Premium según se sepa, sin grabar es próximamente", () => {
    expect(decidirReproduccion({ id: "gn-01", grabado: true, haySesion: true, premium: false })).toBe("play");
    expect(decidirReproduccion({ id: "gn-02", grabado: true, haySesion: true })).toBe("play");
    expect(decidirReproduccion({ id: "gn-02", grabado: true, haySesion: true, premium: null })).toBe("play");
    expect(decidirReproduccion({ id: "gn-02", grabado: true, haySesion: true, premium: false })).toBe("premium");
    expect(decidirReproduccion({ id: "gn-02", grabado: true, haySesion: true, premium: true })).toBe("play");
    expect(decidirReproduccion({ id: "mc-99", grabado: false, haySesion: true })).toBe("proximamente");
    expect(decidirReproduccion({ id: "mc-99", grabado: false, haySesion: false })).toBe("proximamente");
  });
  it("el pendiente arranca solo cuando aparece la sesión", () => {
    expect(pendienteListo("gn-02", false)).toBeNull();
    expect(pendienteListo("gn-02", true)).toBe("gn-02");
    expect(pendienteListo(null, true)).toBeNull();
  });
});
