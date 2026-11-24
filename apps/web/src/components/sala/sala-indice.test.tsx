import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => "/es",
  useSearchParams: () => new URLSearchParams(),
}));

import { SitioHeader } from "@/components/sitio";
import { SitioSala } from "@/components/sala/sala-indice";
import { fichasSala } from "@/lib/sala-indice";
import { copiaSitio } from "@/sitio/i18n";

describe("índice y pestaña de La sala", () => {
  it("la cabecera incluye La sala y Libros, porque la ruta existe", () => {
    const html = renderToStaticMarkup(<SitioHeader lang="es" copy={copiaSitio("es")!} />);
    expect(html).toContain("/es/sala");
    expect(html).toContain("La sala");
    expect(html).toContain("Menú");
    expect(html).toContain("/es/libros");
    expect(html).toMatch(/>Libros</);
    const en = renderToStaticMarkup(<SitioHeader lang="en" copy={copiaSitio("en")!} />);
    expect(en).toContain("/en/sala");
    expect(en).toContain("The gallery");
    expect(en).toContain("/en/libros");
    expect(en).toMatch(/>Books</);
  });

  it("el índice lista las 79 obras, marca las tres abiertas y explica La sala", () => {
    const fichas = fichasSala("es");
    expect(fichas).toHaveLength(79);
    expect(fichas.filter((f) => f.abierta).map((f) => f.id)).toEqual(["gn-01", "gn-07", "is-18"]);
    expect(fichas[0]!.href).toBe("/es/sala/gn-01");
    expect(fichas[0]!.titulo).toBeTruthy();
    expect(fichas[0]!.libro).toMatch(/Génesis|Genesis/i);
    const html = renderToStaticMarkup(<SitioSala lang="es" />);
    expect(html).toContain("data-indice-sala");
    expect(html).toContain("Las obras de arte que acompañan cada episodio");
    expect(html).toContain("Prueba 7 días gratis");
    expect(html).toContain("Hazte premium");
    expect((html.match(/data-gratis/g) ?? []).length).toBe(3);
    expect(html).toContain('data-obra="gn-01"');
    expect(html).toContain("/es/sala/is-18");
  });
});
