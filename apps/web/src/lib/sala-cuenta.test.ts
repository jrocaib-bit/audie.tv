import { destinoTrasEntrar, hrefEntrarParaSala, rutaInternaSegura } from "@audite/domain";
import { describe, expect, it } from "vitest";
import { vistaSala } from "./sala-cuenta";
import { CLAVE_VUELTA } from "./vuelta-entrar";

describe("candado de cuenta de La sala (web)", () => {
  it("con sesión se ve el recorrido", () => {
    expect(vistaSala({ userId: "u1" })).toBe("recorrido");
  });
  it("sin sesión (o sin saberlo aún) se ve el adelanto", () => {
    expect(vistaSala(null)).toBe("adelanto");
    expect(vistaSala(undefined)).toBe("adelanto");
  });
});

describe("vuelta tras entrar a La sala", () => {
  it("los enlaces del candado llevan next", () => {
    expect(hrefEntrarParaSala("es")).toBe("/es/entrar?next=%2Fes%2Fsala");
    expect(hrefEntrarParaSala("en")).toBe("/en/entrar?next=%2Fen%2Fsala");
  });
  it("acepta sala y retos", () => {
    for (const r of ["/es/sala", "/en/sala", "/reto/adviento-isaias"]) {
      expect(rutaInternaSegura(r)).toBe(r);
      expect(destinoTrasEntrar(r)).toBe(r);
    }
  });
  it("rechaza open redirects", () => {
    for (const r of ["//evil.com", "https://evil.com", "/es/sala?x=1", "/es/sala#hash", "/es/sala\\evil", "/es/otra-ruta", "/es/../es/sala"]) {
      expect(rutaInternaSegura(r)).toBeNull();
      expect(destinoTrasEntrar(r)).toBe("/escuchar");
    }
  });
  it("clave de vuelta estable", () => {
    expect(CLAVE_VUELTA).toBe("audite.entrar.next.v1");
  });
});
