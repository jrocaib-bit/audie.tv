import { describe, expect, it } from "vitest";
import { tarjetasHoy } from "./hoy";
import { baseDeContenido, uriDeObra } from "./entorno";
import { textosAdviento } from "./adviento-textos";
import { familiaSerif } from "./serif";

describe("Hoy y la base de contenido", () => {
  it("no repite ninguna obra y usa el Isaac que sí existe", () => {
    const { libros, caminos, retos } = tarjetasHoy("es");
    const todas = [...libros, ...caminos, ...retos].map((item) => item.src);
    expect(new Set(todas).size).toBe(todas.length);
    const paraiso = todas.filter((src) => src.includes("gn-01_o5"));
    expect(paraiso).toHaveLength(1);
    const isaac = caminos.find((item) => item.titulo === "Isaac")?.src ?? "";
    expect(isaac).toContain("gn-08_o4-960.webp");
    expect(isaac).not.toContain("gn-08_o2");
    expect(libros.find((item) => item.id === "gn-04")?.src).toContain("gn-04_o4-960.webp");
    expect(libros.find((item) => item.id === "gn-06")?.src).toContain("gn-06_o3-960.webp");
    for (const src of [...libros, ...caminos].map((item) => item.src)) {
      expect(src.startsWith("https://")).toBe(true);
      expect(src).not.toContain("audite.tv/obras/");
    }
    expect(retos.map((item) => item.src)).toEqual([
      "/obras/reto-adviento_o2-1x1.webp",
      "/obras/reto-navidad_o2-1x1.webp",
    ]);
    expect(uriDeObra(retos[0]!.src, "https://audite.tv")).toBe("https://audite.tv/obras/reto-adviento_o2-1x1.webp");
    expect(uriDeObra(isaac, "https://audite.tv")).toBe(isaac);
  });

  it("apunta a audite.tv salvo que el entorno diga otra base", () => {
    expect(baseDeContenido(undefined)).toBe("https://audite.tv");
    expect(baseDeContenido("")).toBe("https://audite.tv");
    expect(baseDeContenido("http://127.0.0.1:43123/")).toBe("http://127.0.0.1:43123");
  });

  it("traduce Adviento y no usa Georgia si falta Gazpacho", () => {
    expect(textosAdviento("en").entrar).toBe("Sign up or sign in");
    expect(textosAdviento("es").oir).toBe("Oír");
    expect(familiaSerif(true, "ios")).toBe("Gazpacho");
    expect(familiaSerif(false, "ios")).toBe("Times New Roman");
    expect(familiaSerif(false, "android")).toBe("serif");
    expect(familiaSerif(false, "ios")).not.toBe("Georgia");
  });
});

import indice from "../../../content/canon/catalogo-indice.json";
import { modeloHoy, saludo, semanaDe, type CtxHoy } from "./hoy";
import type { Rango } from "./caminos";

function ctxBase(extra: Partial<CtxHoy> = {}): CtxHoy {
  return {
    lang: "es",
    hoyIso: "2026-11-20",
    hora: 9,
    progress: { episodes: {}, listenedOn: [] },
    caminoId: "biblia",
    rangos: indice.rangos as Rango[],
    libros: indice.books,
    titulos: { "gn-01": { es: "En el principio", en: "In the Beginning" } },
    duraciones: { "gn-01": 524.4 },
    cargado: "gn-01",
    pasosAdviento: [{ dia: 1, episodio: "is-01" }, { dia: 2, episodio: "is-02" }],
    ...extra,
  };
}

describe("modelo de Hoy", () => {
  it("no pinta la misma obra dos veces, ni con hero en Génesis", () => {
    const m = modeloHoy(ctxBase());
    expect(m.hero?.id).toBe("gn-01");
    const pintadas = [
      m.hero?.src,
      m.adviento.src,
      ...m.explorar.libros.map((i) => i.src),
      ...m.explorar.caminos.map((i) => i.src),
      ...m.explorar.retos.map((i) => i.src),
    ].filter(Boolean);
    expect(new Set(pintadas).size).toBe(pintadas.length);
    expect(m.obras).toHaveLength(new Set(m.obras).size);
    // El paraíso es el hero: ya no sale en el carril de libros.
    expect(m.explorar.libros.find((i) => i.id === "gn-01")).toBeUndefined();
    expect(m.explorar.retos.find((i) => i.id === "adviento")).toBeUndefined();
  });

  it("avanza el hero al siguiente episodio y cuenta el camino", () => {
    const m = modeloHoy(ctxBase({ progress: { episodes: { "gn-01": { positionSeconds: 524, completed: true } }, listenedOn: [] } }));
    expect(m.hero?.id).toBe("gn-02");
    expect(m.camino).toMatchObject({ hechos: 1, total: 516 });
    expect(m.explorar.libros.find((i) => i.id === "gn-01")).toBeDefined();
    expect(m.hero?.reproducible).toBe(false);
  });

  it("marca retomar y fila continuar según el episodio a medias", () => {
    const a = modeloHoy(ctxBase({ progress: { episodes: { "gn-01": { positionSeconds: 262.2, completed: false } }, listenedOn: [] } }));
    expect(a.hero).toMatchObject({ retomar: true });
    expect(a.hero?.fraccion).toBeCloseTo(0.5);
    expect(a.continuar).toBeNull();
    const b = modeloHoy(ctxBase({ caminoId: "evangelios", progress: { episodes: { "gn-01": { positionSeconds: 100, completed: false } }, listenedOn: [] } }));
    expect(b.hero?.id).not.toBe("gn-01");
    expect(b.continuar?.id).toBe("gn-01");
  });

  it("calcula racha y los siete días de la semana", () => {
    const dias = ["2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"];
    const m = modeloHoy(ctxBase({ progress: { episodes: {}, listenedOn: dias } }));
    expect(m.racha).toBe(4);
    expect(m.semana.map((d) => d.iso)[0]).toBe("2026-11-16");
    expect(m.semana.map((d) => d.hecho)).toEqual([false, true, true, true, true, false, false]);
    expect(m.semana.find((d) => d.hoy)?.iso).toBe("2026-11-20");
    expect(m.semana.filter((d) => d.futuro)).toHaveLength(2);
  });

  it("semana en domingo y saludo por hora", () => {
    expect(semanaDe([], "2026-11-22")[6]).toMatchObject({ iso: "2026-11-22", hoy: true, letra: "D" });
    expect(semanaDe([], "2026-11-22")[0]?.iso).toBe("2026-11-16");
    expect(saludo(8)).toBe("Buenos días");
    expect(saludo(15)).toBe("Buenas tardes");
    expect(saludo(23, "en")).toBe("Good evening");
  });
});
