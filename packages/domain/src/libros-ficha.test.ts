import { describe, expect, it } from "vitest";
import { altCubierta, archivoPortada, etiquetaLegible, etiquetaLomo, textoLimpio, contraste, luminancia, paletaFicha } from "./libros-ficha";

describe("textos de la estantería", () => {
  it("convierte la raya entre números en «a»", () => {
    expect(etiquetaLegible("Génesis 1–2")).toBe("Génesis 1 a 2");
    expect(etiquetaLegible("Cantar de los Cantares 1 – 4")).toBe("Cantar de los Cantares 1 a 4");
    expect(etiquetaLegible("Génesis 1:3–2:4")).toBe("Génesis 1:3 a 2:4");
    expect(etiquetaLegible("Lucas 1")).toBe("Lucas 1");
  });

  it("quita otras rayas y el punto y coma", () => {
    expect(textoLimpio("Uno — dos; tres")).toBe("Uno, dos, tres");
    expect(textoLimpio("Obra, 1577–1587. INV 7304; MR 2338")).toBe("Obra, 1577 a 1587. INV 7304, MR 2338");
  });

  it("etiqueta del lomo, texto alternativo de la cubierta y nombres de archivo", () => {
    expect(etiquetaLomo({ volumen: 3, titulo: "Hacia las cuatro de la tarde", libro: "Juan" })).toBe("Volumen 3, Hacia las cuatro de la tarde, Juan. Abrir ficha");
    expect(altCubierta({ volumen: 3, titulo: "X" })).toBe("Cubierta de «X», volumen 3, de la colección Audite.");
    expect(archivoPortada("lomo", 3, "webp")).toBe("lomo-03.webp");
    expect(archivoPortada("cubierta", 16, "avif", 960)).toBe("cubierta-16-960.avif");
    expect(archivoPortada("cubierta", 1, "webp")).toBe("cubierta-01-480.webp");
  });
});

describe("enlace a la ficha del libro y pestaña", () => {
  it("las cadenas no llevan raya ni punto y coma y existen en los dos idiomas", async () => {
    const { ETIQUETA_VER_LIBRO } = await import("./libros-ficha");
    const { t } = await import("./messages");
    expect(ETIQUETA_VER_LIBRO).toBe("Ver el libro");
    for (const cadena of [ETIQUETA_VER_LIBRO, t("es", "navBooks"), t("en", "navBooks")]) expect(cadena).not.toMatch(/[;—–]/);
    expect(t("es", "navBooks")).toBe("Libros");
    expect(t("en", "navBooks")).toBe("Books");
  });
});

describe("paleta de la ficha", () => {
  const COLORES = ["#805F36", "#8C4A34", "#304B65", "#4A6B52", "#54643D", "#594538", "#683D40", "#406278", "#65654C", "#4B4D70", "#326C6B", "#88414C", "#47545C", "#766955", "#673F55", "#905C33"];

  it("cumple 4,5:1 en los 16 volúmenes y conserva el fondo exacto", () => {
    for (const c of COLORES) {
      const p = paletaFicha(c);
      expect(p.fondo).toBe(c);
      expect(contraste(p.tinta, p.fondo)).toBeGreaterThanOrEqual(4.5);
      expect(contraste(p.tintaInversa, p.tinta)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("hex inválido devuelve la paleta oscura actual", () => {
    for (const malo of ["", "rojo", "#12", "#GGGGGG", "#abc"]) {
      const p = paletaFicha(malo);
      expect(p.fondo).toBe("#100E0C");
      expect(p.tinta).toBe("#F4ECE2");
    }
  });

  it("casi blanco usa tinta oscura y casi negro tinta clara", () => {
    expect(paletaFicha("#FAFAFA").tinta).toBe("#100E0C");
    expect(paletaFicha("#050505").tinta).toBe("#F4ECE2");
    expect(contraste(paletaFicha("#FAFAFA").tintaInversa, paletaFicha("#FAFAFA").tinta)).toBeGreaterThanOrEqual(4.5);
  });

  it("en tonos medios donde ninguna tinta llega, cae a blanco o negro puro", () => {
    const medios = ["#707070", "#747474", "#787878"];
    for (const c of medios) {
      const p = paletaFicha(c);
      expect(["#FFFFFF", "#000000"]).toContain(p.tinta);
      expect(contraste(p.tinta, c)).toBeGreaterThanOrEqual(Math.max(contraste("#F4ECE2", c), contraste("#100E0C", c)));
      expect(contraste(p.tintaInversa, p.tinta)).toBeGreaterThanOrEqual(4.5);
    }
    expect(luminancia("#000000")).toBe(0);
    expect(contraste("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });
});
