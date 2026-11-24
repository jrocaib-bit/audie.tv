import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const leer = (ruta: string) => readFileSync(path.resolve(import.meta.dirname, ruta), "utf8");

describe("pestaña Libros de la barra inferior", () => {
  const layout = leer("../app/_layout.tsx");
  it("hay cinco pestañas y Libros lleva a la estantería", () => {
    const tabs = layout.match(/const tabs = \[([\s\S]*?)\] as const/)?.[1] ?? "";
    expect([...tabs.matchAll(/href: "([^"]+)"/g)].map((m) => m[1])).toEqual(["/", "/camino", "/biblioteca", "/libros", "/ajustes"]);
    expect(tabs).toContain('label: "navBooks"');
    expect(layout).toContain('flex: 1, minHeight: 56');
  });
  it("la ficha de la estantería enlaza a la pantalla de ficha, que existe", () => {
    expect(leer("../app/libros/[slug].tsx")).toContain("export default function FichaLibro");
    expect(leer("./estanteria.tsx")).toContain("ETIQUETA_VER_LIBRO");
  });
});
