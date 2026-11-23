import { describe, expect, it, vi } from "vitest";
import { hrefDePasoAdviento } from "./precio";
import { accionReto, destinoTrasEntrar, hrefEntrarParaReto, rutaRetoSegura } from "./retos-cuenta";

describe("retos con cuenta", () => {
  it("sin sesión lleva a entrar con la vuelta al reto y no guarda", () => {
    const escribir = vi.fn();
    const accion = accionReto(false, "es", "/reto/adviento-isaias");
    if (accion.tipo === "guardar") escribir();
    expect(escribir).not.toHaveBeenCalled();
    expect(accion).toEqual({ tipo: "entrar", href: "/es/entrar?next=%2Freto%2Fadviento-isaias" });
  });
  it("con sesión guarda", () => {
    expect(accionReto(true, "es", "/reto/gn-01")).toEqual({ tipo: "guardar" });
  });
  it("idioma raro cae a es y ruta insegura no se propaga", () => {
    expect(hrefEntrarParaReto("../x", "/reto/a")).toBe("/es/entrar?next=%2Freto%2Fa");
    expect(hrefEntrarParaReto("en", "https://evil.test")).toBe("/en/entrar");
  });
  it("acepta rutas de reto", () => {
    expect(rutaRetoSegura("/reto/adviento-isaias")).toBe("/reto/adviento-isaias");
    expect(rutaRetoSegura("/en/retos")).toBe("/en/retos");
    expect(rutaRetoSegura("/es/retos/adviento-isaias")).toBe("/es/retos/adviento-isaias");
  });
  it("rechaza open redirect", () => {
    for (const malo of ["//evil.test", "https://evil.test", "/\\evil.test", "/reto/../../x", "/reto//evil.test", "javascript:alert(1)", "/escuchar", "/reto/a?x=1", "/reto/a#h", "reto/a", "/reto/a%2F..", "", null, undefined, 5]) {
      expect(rutaRetoSegura(malo)).toBeNull();
      expect(destinoTrasEntrar(malo)).toBe("/escuchar");
    }
  });
  it("vuelve al reto tras entrar", () => {
    expect(destinoTrasEntrar("/reto/adviento-isaias")).toBe("/reto/adviento-isaias");
  });
  it("oír un paso de Adviento sin sesión entra con next al reto; con sesión escucha", () => {
    const cuenta = hrefEntrarParaReto("es", "/reto/adviento-isaias");
    expect(cuenta).toBe("/es/entrar?next=%2Freto%2Fadviento-isaias");
    expect(hrefDePasoAdviento(false, "/ahora?e=is-02", cuenta)).toBe("/es/entrar?next=%2Freto%2Fadviento-isaias");
    expect(hrefDePasoAdviento(true, "/ahora?e=is-02", cuenta)).toBe("/ahora?e=is-02");
    const marcar = accionReto(false, "es", "/reto/adviento-isaias");
    expect(marcar.tipo === "entrar" && marcar.href).toBe(cuenta);
  });
});
