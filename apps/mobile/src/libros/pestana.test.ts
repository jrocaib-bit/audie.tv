import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RUTAS_PESTANAS } from "../ui/mini";
import { PESTANAS, SEGMENTOS_SALA } from "../ui/pestanas";

const leer = (ruta: string) => readFileSync(path.resolve(import.meta.dirname, ruta), "utf8");

// Integración app: la barra de este árbol es `TabBar` con cuatro pestañas y Libros vive como segmento de La sala.
describe("Libros dentro de la pestaña La sala", () => {
  const layout = leer("../app/_layout.tsx");
  it("Libros es un segmento de La sala y la barra tiene cuatro pestañas", () => {
    expect(PESTANAS.map((p) => p.href)).toEqual(["/", "/escuchar", "/retos", "/sala"]);
    expect(SEGMENTOS_SALA.map((s) => [s.href, s.etiqueta])).toEqual([["/sala", "tabSala"], ["/sala/libros", "tabLibros"]]);
    expect(layout).toContain("PESTANAS.map((p) => ({ href: p.href, icono: p.icono, etiqueta: t[p.etiqueta] }))");
    expect(layout).toContain("actual={pestanaActiva(path)}");
    expect(RUTAS_PESTANAS).toContain("/sala/libros");
    expect(RUTAS_PESTANAS).not.toContain("/libros");
    expect(leer("../app/sala/libros.tsx")).toContain('from "../../vistas/Libros"');
    // Pestañas de ancho fijo dentro de una píldora compacta y centrada, y etiqueta que cabe a 390 sin cortarse.
    const barra = leer("../ui/TabBar.tsx");
    expect(barra).toContain("width: BARRA.anchoPestana, minHeight: 52");
    expect(barra).toContain("width: anchoPildora(pestanas.length), maxWidth: \"100%\"");
    expect(barra).toContain("adjustsFontSizeToFit");
    // La barra es una píldora flotante: separada de los bordes, redondeada, con sombra y con el punto de acento en la activa.
    expect(barra).toContain("paddingHorizontal: BARRA.margenLateral, paddingBottom: margenInferiorBarra(insets.bottom), alignItems: \"center\"");
    expect(barra).toContain("borderRadius: BARRA.radio");
    expect(barra).toContain("boxShadow: SOMBRA_FLOTANTE");
    expect(barra).toContain("backgroundColor: activa ? c.accent");
    // Flota sobre el contenido junto al mini reproductor, y las pantallas reservan su alto.
    expect(layout).toContain('<View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>');
    expect(layout).toContain("<HuecoInferiorContext.Provider value={enPestana ? hueco : null}>");
    for (const pantalla of ["../app/index.tsx", "../vistas/Caminos.tsx", "../app/retos.tsx", "../vistas/Biblioteca.tsx", "../vistas/Libros.tsx", "../app/ajustes.tsx"]) expect(leer(pantalla)).toContain("paddingBottom: 32 + hueco");
    expect(layout).toContain('paddingBottom: path === "/sala" ? hueco : 0');
  });
  it("la ficha de la estantería enlaza a la pantalla de ficha, que existe", () => {
    expect(leer("../app/libros/[slug].tsx")).toContain("export default function FichaLibro");
    expect(leer("./estanteria.tsx")).toContain("ETIQUETA_VER_LIBRO");
  });
});
