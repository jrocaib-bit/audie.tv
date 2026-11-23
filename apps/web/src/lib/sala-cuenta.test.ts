import { destinoTrasEntrar, hrefEntrarParaSala, rutaInternaSegura } from "@audite/domain";
import { describe, expect, it } from "vitest";
import { datosVistaSala, idsSala, recorridoSala, vistaSala } from "./sala-cuenta";
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
  it("adelanto: sin textos ni pasos y con next seguro", () => {
    for (const s of [null, undefined]) {
      const a = datosVistaSala(s, "gn-01", "es");
      expect(a.vista).toBe("adelanto");
      expect(a.recorrido).toBeNull();
      expect(a.hrefEntrar).toBe("/es/entrar?next=%2Fes%2Fsala");
      const b = datosVistaSala(s, "gn-02", "es");
      expect(b.recorrido).toBeNull();
      expect(b.hrefEntrar).toBe("/es/entrar?next=%2Fes%2Fsala%2Fgn-02");
      expect(rutaInternaSegura(decodeURIComponent(b.hrefEntrar.split("next=")[1]!))).toBe("/es/sala/gn-02");
    }
  });
  it("recorrido: devuelve apertura, pasos y cierre completos", () => {
    const v = datosVistaSala({ userId: "u1" }, "gn-01", "es");
    const r = recorridoSala("gn-01")!;
    expect(v.vista).toBe("recorrido");
    expect(v.recorrido?.apertura.titulo).toBe("Un círculo de nogal para el principio");
    expect(v.recorrido?.apertura.texto).toBe(r.apertura.texto.es);
    expect(v.recorrido?.pasos).toHaveLength(r.pasos.length);
    expect(v.recorrido?.cierre.texto).toBe(r.cierre.texto.es);
    expect(datosVistaSala({ userId: "u1" }, "gn-02", "en").recorrido?.apertura.titulo).toBe(recorridoSala("gn-02")!.apertura.titulo.en);
  });
});
