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
    // Seis pestañas de igual ancho (flex: 1, minWidth: 0) y etiqueta que cabe a 390 sin cortarse.
    const barra = leer("../ui/TabBar.tsx");
    expect(barra).toContain("flex: 1, minWidth: 0, minHeight: 52");
    expect(barra).toContain("adjustsFontSizeToFit");
    // La barra es una píldora flotante: separada de los bordes, redondeada, con sombra y con el punto de acento en la activa.
    expect(barra).toContain("paddingHorizontal: BARRA.margenLateral, paddingBottom: margenInferiorBarra(insets.bottom)");
    expect(barra).toContain("borderRadius: BARRA.radio");
    expect(barra).toContain("boxShadow: SOMBRA_FLOTANTE");
    expect(barra).toContain("backgroundColor: activa ? c.accent");
    // Flota sobre el contenido junto al mini reproductor, y las pantallas reservan su alto.
    expect(layout).toContain('<View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>');
    expect(layout).toContain("<HuecoInferiorContext.Provider value={enPestana ? hueco : null}>");
    for (const pantalla of ["index", "camino", "retos", "biblioteca", "libros", "ajustes"]) expect(leer(`../app/${pantalla}.tsx`)).toContain("paddingBottom: 32 + hueco");
    expect(layout).toContain('paddingBottom: path === "/sala" ? hueco : 0');
  });
  it("la ficha de la estantería enlaza a la pantalla de ficha, que existe", () => {
    expect(leer("../app/libros/[slug].tsx")).toContain("export default function FichaLibro");
    expect(leer("./estanteria.tsx")).toContain("ETIQUETA_VER_LIBRO");
  });
});
