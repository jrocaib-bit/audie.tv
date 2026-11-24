import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComparativaSala } from "@/lib/sala-contexto";
import { Comparativa } from "./comparativa";

const base: ComparativaSala = {
  trasPaso: 2,
  entrada: "Una imagen frente a otra.",
  creditos: "Crédito de la fuente.",
  imagenes: [
    { src: "/a.webp", ancho: 1000, alto: 1300, alt: "A", pie: "Pie A." },
    { src: "/b.webp", ancho: 1000, alto: 1200, alt: "B", pie: "Pie B." },
  ],
};

describe("Comparativa", () => {
  it("pinta pies, entrada y créditos en su bloque, con imágenes lazy y con tamaño", () => {
    const html = renderToStaticMarkup(<Comparativa datos={base} />);
    expect(html).toContain("data-comparativa");
    expect(html).toContain("Pie A.");
    expect(html).toContain("Pie B.");
    expect(html).toContain("Una imagen frente a otra.");
    expect(html).toMatch(/<p data-creditos[^>]*>Crédito de la fuente\.<\/p>/);
    expect((html.match(/loading="lazy"/g) ?? []).length).toBe(2);
    expect(html).toContain('width="1000" height="1300"');
    expect(html).not.toContain("Crédito de la fuente.</figcaption>");
  });
  it("sin material no pinta nada", () => {
    for (const d of [null, undefined, { ...base, imagenes: [] }, { ...base, creditos: "" }, { ...base, imagenes: [{ ...base.imagenes[0]!, pie: "" }] }]) {
      expect(renderToStaticMarkup(<Comparativa datos={d} />)).toBe("");
    }
  });
  it("descarta las imágenes incompletas y conserva las buenas", () => {
    const html = renderToStaticMarkup(<Comparativa datos={{ ...base, imagenes: [{ ...base.imagenes[0]!, src: "" }, base.imagenes[1]!] }} />);
    expect(html).toContain("Pie B.");
    expect(html).not.toContain("Pie A.");
  });
});
