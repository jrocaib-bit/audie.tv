import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { tx } from "../textos";
import { PESTANAS, REDIRECCIONES, RUTAS_PESTANAS, SEGMENTOS_BIBLIA, SEGMENTOS_SALA, pestanaActiva, segmentoActivo } from "./pestanas";

vi.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

const { BARRA, anchoPildora } = await import("./barra-flotante");

const app = (ruta: string) => path.resolve(import.meta.dirname, "../app", ruta);
const leer = (ruta: string) => readFileSync(app(ruta), "utf8");

describe("las cuatro pestañas", () => {
  it("van en orden Hoy, Biblia, Retos y La sala", () => {
    expect(PESTANAS.map((p) => [p.href, p.etiqueta])).toEqual([
      ["/", "tabHoy"],
      ["/escuchar", "tabBiblia"],
      ["/retos", "tabRetos"],
      ["/sala", "tabSala"],
    ]);
  });
  it("tienen etiqueta corta en es y en", () => {
    expect(PESTANAS.map((p) => tx("es")[p.etiqueta])).toEqual(["Hoy", "Biblia", "Retos", "La sala"]);
    expect(PESTANAS.map((p) => tx("en")[p.etiqueta])).toEqual(["Today", "Bible", "Challenges", "The gallery"]);
  });
  it("la pestaña Biblia no usa /biblia, que sigue siendo el índice", () => {
    expect(PESTANAS.map((p) => p.href)).not.toContain("/biblia");
    expect(RUTAS_PESTANAS).not.toContain("/biblia");
    expect(leer("biblia.tsx")).not.toContain("Redirect");
    expect(leer("biblia.tsx")).toContain("export default");
    expect(leer("../vistas/Biblioteca.tsx")).toContain('router.push("/biblia")');
  });
  it("la píldora es compacta: no llega a los bordes a 390 y cada pestaña mide al menos 44", () => {
    const ancho = anchoPildora(PESTANAS.length);
    expect(ancho).toBeLessThanOrEqual(280);
    expect(390 - ancho).toBeGreaterThanOrEqual(2 * 40);
    expect(BARRA.anchoPestana).toBeGreaterThanOrEqual(44);
    expect(BARRA.alto).toBeGreaterThanOrEqual(44);
  });
});

describe("resaltado por segmento", () => {
  it.each([
    ["/", "/"],
    ["/escuchar", "/escuchar"],
    ["/escuchar/caminos", "/escuchar"],
    ["/retos", "/retos"],
    ["/sala", "/sala"],
    ["/sala/libros", "/sala"],
  ])("%s resalta %s", (ruta, pestana) => {
    expect(pestanaActiva(ruta)).toBe(pestana);
  });
  it.each(["/ajustes", "/biblia", "/libros/gen-antes", "/reto/adviento-isaias"])("%s no resalta ninguna", (ruta) => {
    expect(pestanaActiva(ruta)).toBeNull();
  });
  it("Ajustes enseña la barra", () => {
    expect(RUTAS_PESTANAS).toContain("/ajustes");
  });
});

describe("segmentados", () => {
  it("Biblia abre en Biblioteca y La sala abre en La sala", () => {
    expect(SEGMENTOS_BIBLIA.map((s) => [s.href, tx("es")[s.etiqueta]])).toEqual([["/escuchar", "Biblioteca"], ["/escuchar/caminos", "Caminos"]]);
    expect(SEGMENTOS_SALA.map((s) => [s.href, tx("es")[s.etiqueta]])).toEqual([["/sala", "La sala"], ["/sala/libros", "Libros"]]);
    expect(segmentoActivo(SEGMENTOS_BIBLIA, "/escuchar").href).toBe("/escuchar");
    expect(segmentoActivo(SEGMENTOS_SALA, "/sala").href).toBe("/sala");
  });
  it("el segmento activo sale de la URL", () => {
    expect(segmentoActivo(SEGMENTOS_BIBLIA, "/escuchar/caminos").href).toBe("/escuchar/caminos");
    expect(segmentoActivo(SEGMENTOS_SALA, "/sala/libros").href).toBe("/sala/libros");
    expect(segmentoActivo(SEGMENTOS_SALA, "/otra").href).toBe("/sala");
  });
  it("cambiar de segmento sustituye la URL y cada URL monta su vista", () => {
    const layout = readFileSync(path.resolve(import.meta.dirname, "SegmentosLayout.tsx"), "utf8");
    expect(layout).toContain("activo={activo.href}");
    expect(layout).toContain('if (href !== path) router.replace(href as "/");');
    expect(leer("escuchar/_layout.tsx")).toContain("<SegmentosLayout pestana={PESTANAS[1]} />");
    expect(leer("sala/_layout.tsx")).toContain("<SegmentosLayout pestana={PESTANAS[3]} />");
    expect(PESTANAS[1].segmentos).toBe(SEGMENTOS_BIBLIA);
    expect(PESTANAS[3].segmentos).toBe(SEGMENTOS_SALA);
    expect(leer("escuchar/index.tsx")).toContain('from "../../vistas/Biblioteca"');
    expect(leer("escuchar/caminos.tsx")).toContain('from "../../vistas/Caminos"');
    expect(leer("sala/index.tsx")).toContain('from "../../vistas/Sala"');
    expect(leer("sala/libros.tsx")).toContain('from "../../vistas/Libros"');
  });
  it("el segmentado es accesible y de 44 de alto", () => {
    const seg = readFileSync(path.resolve(import.meta.dirname, "Segmentado.tsx"), "utf8");
    expect(seg).toContain('accessibilityRole="tablist"');
    expect(seg).toContain('role="tab" selected={sel}');
    expect(seg).toContain("minHeight: 44");
  });
});

describe("redirecciones", () => {
  it("llevan las rutas viejas a su sitio nuevo", () => {
    expect(REDIRECCIONES).toEqual({
      "/biblioteca": "/escuchar",
      "/catalogo": "/escuchar",
      "/camino": "/escuchar/caminos",
      "/caminos": "/escuchar/caminos",
      "/libros": "/sala/libros",
    });
  });
  it.each(Object.keys(REDIRECCIONES))("%s es un Redirect a su destino", (ruta) => {
    const fuente = leer(`${ruta.slice(1)}.tsx`);
    expect(fuente).toContain('import { Redirect } from "expo-router";');
    expect(fuente).toContain(`<Redirect href={REDIRECCIONES["${ruta}"]} />`);
  });
  it("cada destino es una ruta de pestaña que existe", () => {
    for (const destino of Object.values(REDIRECCIONES)) {
      expect(RUTAS_PESTANAS).toContain(destino);
      const archivo = destino === "/escuchar" || destino === "/sala" ? `${destino.slice(1)}/index.tsx` : `${destino.slice(1)}.tsx`;
      expect(existsSync(app(archivo))).toBe(true);
    }
  });
  it("/libros redirige solo la estantería: la ficha y el lector siguen en su ruta", () => {
    expect(leer("libros/[slug].tsx")).not.toContain("Redirect");
    expect(leer("libros/[slug]/leer.tsx")).not.toContain("Redirect");
    expect(Object.keys(REDIRECCIONES).filter((r) => r.startsWith("/libros"))).toEqual(["/libros"]);
  });
  it("/sala y /biblia no redirigen", () => {
    expect(Object.keys(REDIRECCIONES)).not.toContain("/sala");
    expect(Object.keys(REDIRECCIONES)).not.toContain("/biblia");
    expect(existsSync(app("sala.tsx"))).toBe(false);
  });
  it("los enlaces internos apuntan a las rutas nuevas", () => {
    const hoy = leer("index.tsx");
    expect(hoy).not.toMatch(/"\/(camino|biblioteca|libros|catalogo)"/);
    expect(hoy).toContain('router.push("/escuchar/caminos")');
    expect(hoy).toContain('router.push("/escuchar")');
    expect(leer("retos.tsx")).toContain('router.navigate("/escuchar/caminos")');
    const biblioteca = leer("../vistas/Biblioteca.tsx");
    expect(biblioteca).toContain('router.push("/sala/libros")');
    expect(biblioteca).not.toContain('router.push("/libros")');
  });
});
