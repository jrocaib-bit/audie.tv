import { describe, expect, it } from "vitest";
import { SUBTITULO_LIBROS, TITULO_LIBROS } from "./textos";

describe("textos de la sección Libros", () => {
  it("el título y el subtítulo son los pedidos", () => {
    expect(TITULO_LIBROS).toBe("La Biblia comentada");
    expect(SUBTITULO_LIBROS).toBe("De la mano de los Padres de la Iglesia, los santos y los grandes teólogos");
  });

  it("van sin punto y coma, rayas ni construcciones prohibidas", () => {
    for (const cadena of [TITULO_LIBROS, SUBTITULO_LIBROS]) {
      expect(cadena, cadena).not.toMatch(/[;—–]/);
      expect(cadena, cadena).not.toMatch(/\bno es\b|\bsino\b|\bCEE\b/i);
    }
  });
});
