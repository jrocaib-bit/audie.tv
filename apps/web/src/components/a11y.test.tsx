/** @vitest-environment jsdom */
import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { ListaPorLibros } from "./lista-libros";

afterEach(() => cleanup());

function contraste(a: string, b: string): number {
  const canal = (hex: string) =>
    [0, 2, 4].map((i) => parseInt(hex.slice(i + 1, i + 3), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const l = (hex: string) => {
    const [r, g, b2] = canal(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
  };
  const [hi, lo] = [l(a), l(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("accesibilidad", () => {
  it("mantiene el ocre y el oro por encima de WCAG AA", () => {
    expect(contraste("#7a5428", "#f3ecdf")).toBeGreaterThanOrEqual(4.5);
    expect(contraste("#fbf6ee", "#7a5428")).toBeGreaterThanOrEqual(4.5);
    expect(contraste("#5e564c", "#f3ecdf")).toBeGreaterThanOrEqual(4.5);
    expect(contraste("#e0c48a", "#100e0c")).toBeGreaterThanOrEqual(4.5);
    expect(contraste("#1a140c", "#e0c48a")).toBeGreaterThanOrEqual(4.5);
    expect(contraste("#b7ab9c", "#100e0c")).toBeGreaterThanOrEqual(4.5);
  });

  it("no marca violaciones de axe en la lista del catálogo", async () => {
    const { container } = render(
      <main>
        <h1>Biblioteca</h1>
        <ListaPorLibros
          locale="es"
          catalog={{
            actualizado: "2026-11-09",
            books: [{ id: "gn", testament: "ot", order: 1, name: { es: "Génesis", en: "Genesis" }, status: "not_in_pilot" }],
            episodes: [],
            pendientes: [
              {
                id: "gn-01",
                bookId: "gn",
                orden: 1,
                capitulos: "1-2",
                rango: "1:1-2:25",
                titulo: { es: "En el principio", en: "In the Beginning" },
                tituloCorto: { es: "En el principio", en: "In the Beginning" },
                etiqueta: { es: "Génesis 1–2", en: "Genesis 1–2" },
                propuesta: false,
                presentacion: "preparacion",
              },
            ],
            artworks: [],
            cues: [],
            captions: [],
            locales: [],
            outlineNote: { es: "", en: "" },
            fuenteTexto: { es: null, en: null },
            rangos: [{ id: "gn-01", bookId: "gn", orden: 1, rango: "1:1-2:25" }],
          }}
        />
      </main>,
    );
    const resultados = await axe.run(container, { rules: { region: { enabled: false }, "color-contrast": { enabled: false } } });
    expect(resultados.violations).toEqual([]);
  });
});
