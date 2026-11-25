import { describe, expect, it } from "vitest";
import { PRECIO } from "@audite/domain";
import {
  SUBTITULO_SECCION_LIBROS,
  TITULO_SECCION_LIBROS,
  descripcionSeoCatalogo,
  tituloSeoCatalogo,
} from "./textos-catalogo";

describe("textos de la portada de Libros", () => {
  it("el título y el subtítulo son los pedidos", () => {
    expect(TITULO_SECCION_LIBROS.es).toBe("La Biblia comentada");
    expect(SUBTITULO_SECCION_LIBROS.es).toBe("De la mano de los Padres de la Iglesia, los santos y los grandes teólogos");
    expect(tituloSeoCatalogo("es")).toBe("La Biblia comentada | Audite");
    expect(tituloSeoCatalogo("en")).toBe("The Bible with commentary | Audite");
  });

  it("la descripción SEO nombra los comentarios y cabe en 160 caracteres", () => {
    const es = descripcionSeoCatalogo("es", PRECIO.pruebaDias);
    const en = descripcionSeoCatalogo("en", PRECIO.pruebaDias);
    expect(es).toContain("Padres de la Iglesia");
    expect(es).toContain("santos");
    expect(es).toContain("teólogos");
    expect(en).toContain("Fathers of the Church");
    expect(en).toContain("saints");
    expect(en).toContain("theologians");
    expect(es.length).toBeLessThanOrEqual(160);
    expect(en.length).toBeLessThanOrEqual(160);
  });

  it("van sin punto y coma, rayas ni construcciones prohibidas, en los dos idiomas", () => {
    const cadenas = [
      TITULO_SECCION_LIBROS.es,
      TITULO_SECCION_LIBROS.en,
      SUBTITULO_SECCION_LIBROS.es,
      SUBTITULO_SECCION_LIBROS.en,
      descripcionSeoCatalogo("es", PRECIO.pruebaDias),
      descripcionSeoCatalogo("en", PRECIO.pruebaDias),
      tituloSeoCatalogo("es"),
      tituloSeoCatalogo("en"),
    ];
    for (const cadena of cadenas) {
      expect(cadena, cadena).not.toMatch(/[;—–]/);
      expect(cadena, cadena).not.toMatch(/\bno es\b|\bsino\b|\bCEE\b/i);
    }
  });
});
