import { describe, expect, it } from "vitest";
import { accionReto, destinoTrasEntrar, hrefEntrarConNext, hrefEntrarParaSala, rutaInternaSegura, rutaRetoSegura } from "./retos-cuenta";

const MALAS = ["//evil.com", "https://evil.com", "/es/sala?x=1", "/es/sala#hash", "/es/sala\\evil", "/es/otra-ruta", "/es/../es/sala", "/es/sala/", "", "/" + "a".repeat(130)];

describe("rutaInternaSegura", () => {
  it.each(["/es/sala", "/en/sala", "/es/sala/gn-01", "/reto/adviento-isaias", "/es/retos", "/es/retos/profecias-pasion"])("acepta %s", (r) => {
    expect(rutaInternaSegura(r)).toBe(r);
  });
  it.each(MALAS)("rechaza %s", (r) => {
    expect(rutaInternaSegura(r)).toBeNull();
  });
  it("rechaza no strings", () => {
    expect(rutaInternaSegura(null)).toBeNull();
    expect(rutaInternaSegura(42)).toBeNull();
  });
  it("rutaRetoSegura es alias", () => {
    expect(rutaRetoSegura("/es/sala")).toBe("/es/sala");
  });
});

describe("hrefEntrar y destino", () => {
  it("sala", () => {
    expect(hrefEntrarParaSala("es")).toBe("/es/entrar?next=%2Fes%2Fsala");
    expect(hrefEntrarParaSala("en")).toBe("/en/entrar?next=%2Fen%2Fsala");
  });
  it("ruta insegura: sin next", () => {
    expect(hrefEntrarConNext("es", "//evil.com")).toBe("/es/entrar");
    expect(hrefEntrarConNext("xx1", "/reto/adviento-isaias")).toBe("/es/entrar?next=%2Freto%2Fadviento-isaias");
  });
  it("destinoTrasEntrar", () => {
    expect(destinoTrasEntrar("/en/sala")).toBe("/en/sala");
    expect(destinoTrasEntrar("https://evil.com")).toBe("/escuchar");
    expect(destinoTrasEntrar(null, "/x")).toBe("/x");
  });
  it("accionReto", () => {
    expect(accionReto(true, "es", "/reto/a")).toEqual({ tipo: "guardar" });
    expect(accionReto(false, "es", "/reto/adviento-isaias")).toEqual({ tipo: "entrar", href: "/es/entrar?next=%2Freto%2Fadviento-isaias" });
  });
});
