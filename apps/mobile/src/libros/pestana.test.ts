import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RUTAS_PESTANAS } from "../ui/mini";

const leer = (ruta: string) => readFileSync(path.resolve(import.meta.dirname, ruta), "utf8");

// Integración app: la barra de este árbol es `TabBar` con `pestanas: PestanaDef[]` y convive con La sala.
describe("pestaña Libros de la barra inferior", () => {
  const layout = leer("../app/_layout.tsx");
  it("Libros lleva a la estantería y convive con La sala", () => {
    const lista = layout.match(/const pestanas: PestanaDef\[\] = \[([\s\S]*?)\];/)?.[1] ?? "";
    expect([...lista.matchAll(/href: "([^"]+)"/g)].map((m) => m[1])).toEqual(["/", "/camino", "/retos", "/biblioteca", "/libros", "/sala"]);
    expect(lista).toContain("etiqueta: t.tabLibros");
    expect(RUTAS_PESTANAS).toContain("/libros");
    expect(leer("../ui/TabBar.tsx")).toContain("flex: 1, minHeight: 52");
  });
  it("la ficha de la estantería enlaza a la pantalla de ficha, que existe", () => {
    expect(leer("../app/libros/[slug].tsx")).toContain("export default function FichaLibro");
    expect(leer("./estanteria.tsx")).toContain("ETIQUETA_VER_LIBRO");
  });
});
