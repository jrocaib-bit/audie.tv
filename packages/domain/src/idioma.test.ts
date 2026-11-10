import { describe, expect, it } from "vitest";
import { idiomaContenido, idiomaDeEtiqueta, idiomaDeLista, idiomaResuelto } from "./idioma";

describe("idioma de la interfaz", () => {
  it("agrupa las variantes y deja el español por defecto", () => {
    expect(idiomaDeEtiqueta("zh-Hans")).toBe("zh");
    expect(idiomaDeEtiqueta("zh-CN")).toBe("zh");
    expect(idiomaDeEtiqueta("pt-BR")).toBe("pt");
    expect(idiomaDeEtiqueta("pt_PT")).toBe("pt");
    expect(idiomaDeEtiqueta("fr-CA")).toBe("fr");
    expect(idiomaDeEtiqueta("de-AT")).toBe("de");
    expect(idiomaDeEtiqueta("it-IT")).toBe("it");
    expect(idiomaDeEtiqueta("en-US")).toBe("en");
    expect(idiomaDeLista(["xx", "zh-TW"])).toBe("zh");
    expect(idiomaDeLista(["und", "*"])).toBe("es");
    expect(idiomaDeLista([])).toBe("es");
  });

  it("la elección guardada prevalece sobre la lista del dispositivo", () => {
    expect(idiomaResuelto("de", ["es-ES", "en"])).toBe("de");
    expect(idiomaResuelto("zh-HK", ["fr"])).toBe("zh");
    expect(idiomaResuelto(null, ["xx-YY"])).toBe("es");
    expect(idiomaResuelto(undefined, ["en-GB", "es"])).toBe("en");
  });

  it("no traduce el contenido: solo inglés o español", () => {
    expect(idiomaContenido("en")).toBe("en");
    expect(idiomaContenido("zh")).toBe("es");
    expect(idiomaContenido("fr")).toBe("es");
  });
});
