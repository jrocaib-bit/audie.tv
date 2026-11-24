import { destinoTrasEntrar, hrefEntrarParaSala, rutaInternaSegura } from "@audite/domain";
import { describe, expect, it } from "vitest";
import { datosVistaSala, vistaSala } from "./sala-cuenta";
import { adelantoSala, idsSala, recorridoSala, resolverRecorrido } from "./sala-recorridos";
import { CLAVE_VUELTA } from "./vuelta-entrar";

describe("tres estados de acceso de La sala (web)", () => {
  it("sin sesión (o sin saberlo aún) es sin-sesion, diga lo que diga el servidor", () => {
    expect(vistaSala(null)).toBe("sin-sesion");
    expect(vistaSala(undefined)).toBe("sin-sesion");
    expect(vistaSala(null, "premium")).toBe("sin-sesion");
  });
  it("con sesión es gratuito salvo que el servidor diga premium (nunca se asume)", () => {
    expect(vistaSala({ userId: "u1" })).toBe("gratuito");
    expect(vistaSala({ userId: "u1" }, null)).toBe("gratuito");
    expect(vistaSala({ userId: "u1" }, "gratuito")).toBe("gratuito");
    expect(vistaSala({ userId: "u1" }, "premium")).toBe("premium");
    expect(vistaSala({ userId: "u1" }, "sin-sesion")).toBe("sin-sesion");
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

describe("recorridos-sala.json", () => {
  it("tiene los 79 episodios completos en ES y EN", () => {
    const ids = idsSala();
    expect(ids).toHaveLength(79);
    for (const id of ids) {
      const r = recorridoSala(id)!;
      for (const l of ["es", "en"] as const) {
        expect(r.apertura.titulo[l], id).toBeTruthy();
        expect(r.apertura.texto[l], id).toBeTruthy();
        expect(r.pasos.length, id).toBeGreaterThan(0);
        for (const p of r.pasos) {
          expect(p.titulo[l], id).toBeTruthy();
          expect(p.texto[l], id).toBeTruthy();
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(1);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(1);
          expect(p.zoom).toBeGreaterThan(0);
        }
        expect(r.cierre.titulo[l], id).toBeTruthy();
        expect(r.cierre.texto[l], id).toBeTruthy();
      }
    }
  });
  it("id desconocido no existe", () => {
    expect(recorridoSala("nope")).toBeNull();
    expect(recorridoSala("__proto__")).toBeNull();
  });
});

describe("vista de La sala por sesión", () => {
  it("sin sesión: vista y next seguro, sin textos", () => {
    for (const s of [null, undefined]) {
      expect(datosVistaSala(s, "gn-01", "es")).toEqual({ vista: "sin-sesion", hrefEntrar: "/es/entrar?next=%2Fes%2Fsala%2Fgn-01" });
      const b = datosVistaSala(s, "gn-02", "es");
      expect(b.hrefEntrar).toBe("/es/entrar?next=%2Fes%2Fsala%2Fgn-02");
      expect(rutaInternaSegura(decodeURIComponent(b.hrefEntrar.split("next=")[1]!))).toBe("/es/sala/gn-02");
    }
  });
  it("con sesión: gratuito o premium según el servidor", () => {
    expect(datosVistaSala({ userId: "u1" }, "gn-01", "es").vista).toBe("gratuito");
    expect(datosVistaSala({ userId: "u1" }, "gn-01", "es", "premium").vista).toBe("premium");
  });
});

describe("resolverRecorrido (servidor)", () => {
  it("devuelve apertura, pasos y cierre completos", () => {
    const v = resolverRecorrido("gn-01", "es")!;
    const r = recorridoSala("gn-01")!;
    expect(v.apertura.titulo).toBe("Un círculo de nogal para el principio");
    expect(v.apertura.texto).toBe(r.apertura.texto.es);
    expect(v.pasos).toHaveLength(r.pasos.length);
    expect(v.cierre.texto).toBe(r.cierre.texto.es);
    expect(resolverRecorrido("gn-02", "en")?.apertura.titulo).toBe(recorridoSala("gn-02")!.apertura.titulo.en);
    expect(resolverRecorrido("nope", "es")).toBeNull();
  });
});

describe("adelantoSala (servidor)", () => {
  it("solo la apertura, nada de pasos ni cierre", () => {
    const a = adelantoSala("gn-01", "es")!;
    expect(Object.keys(a).sort()).toEqual(["texto", "titulo"]);
    expect(a.texto).toBe(recorridoSala("gn-01")!.apertura.texto.es);
    expect(adelantoSala("nope", "es")).toBeNull();
  });
});
