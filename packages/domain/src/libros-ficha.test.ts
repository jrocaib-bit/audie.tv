import { describe, expect, it } from "vitest";
import { altCubierta, archivoPortada, etiquetaLegible, etiquetaLomo, textoLimpio } from "./libros-ficha";

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
