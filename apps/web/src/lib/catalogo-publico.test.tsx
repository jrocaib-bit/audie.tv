import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { agruparLibros } from "@/lib/publico";

vi.mock("next/image", () => ({
  default: (props: { alt?: string }) => <img alt={props.alt ?? ""} />,
}));

import Libro from "@/app/[lang]/libro/[id]/page";
import Episodio from "@/app/[lang]/catalogo/[id]/page";

describe("catálogo público", () => {
  it("agrupa los 73 libros y la ficha distingue lo que ya se puede oír", async () => {
    const catalogo = loadAppCatalog();
    const grupos = agruparLibros(catalogo.books);
    expect(grupos.at.length + grupos.nt.length).toBe(73);
    const exodo = renderToStaticMarkup(await Libro({ params: Promise.resolve({ lang: "es", id: "ex" }) }));
    expect(exodo.match(/href="\/es\/catalogo\/ex-/g)).toHaveLength(18);
    expect(exodo).toContain("18 episodios · 17 disponibles");
    const inicio = exodo.indexOf('href="/es/catalogo/ex-13"');
    const bloqueado = exodo.slice(inicio, exodo.indexOf("</li>", inicio));
    expect(bloqueado).toContain("Próximamente");
    expect(bloqueado).not.toContain("Escuchar");
    const genesis = renderToStaticMarkup(await Episodio({ params: Promise.resolve({ lang: "es", id: "gn-01" }) }));
    expect(genesis).toContain("Escuchar");
    expect(genesis).toContain("Sobre la obra");
    expect(genesis).not.toContain("Conferencia Episcopal");
    const numeros = renderToStaticMarkup(await Episodio({ params: Promise.resolve({ lang: "es", id: "nm-01" }) }));
    expect(numeros).toContain("Próximamente");
    expect(numeros).not.toContain("Escuchar");
    expect(numeros).not.toContain("Conferencia Episcopal");
  });
});
