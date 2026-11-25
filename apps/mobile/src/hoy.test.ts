import { describe, expect, it } from "vitest";
import { tarjetasHoy } from "./hoy";
import { baseDeContenido, obraEnBundle, uriDeObra } from "./entorno";
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

  it("sirve las obras de Profecías desde el bundle, no desde audite.tv", () => {
    expect(obraEnBundle("/obras/reto-profecias_o1-1x1.webp")).toBe(true);
    expect(obraEnBundle("/obras/reto-profecias_pp-01.webp")).toBe(true);
    expect(obraEnBundle("/obras/reto-profecias_pp-08.webp")).toBe(true);
    expect(obraEnBundle("/obras/reto-adviento_o2-1x1.webp")).toBe(false);
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
import { infoEpisodio, modeloHoy, saludo, semanaDe, type CtxHoy } from "./hoy";
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
    etiquetas: { "gn-01": { es: "Génesis 1–2", en: "Genesis 1–2" } },
    duraciones: { "gn-01": 524.4 },
    actual: "gn-01",
    grabados: ["gn-01", "gn-02", "jn-01"],
    ...extra,
  };
}

describe("modelo de Hoy", () => {
  it("el hero es el episodio pendiente del camino elegido, con día y total reales", () => {
    const m = modeloHoy(ctxBase());
    expect(m.estado).toBe("listo");
    expect(m.hero).toMatchObject({ id: "gn-01", dia: 1, total: 516, reproducible: true, retomar: false });
    expect(m.hero?.subtitulo).toContain("Génesis");
    const g = modeloHoy(ctxBase({ caminoId: "genesis", progress: { episodes: { "gn-01": { positionSeconds: 524, completed: true }, "gn-02": { positionSeconds: 9, completed: true } }, listenedOn: [] } }));
    expect(g.hero).toMatchObject({ id: "gn-03", dia: 3, total: 22 });
    expect(g.camino).toMatchObject({ hechos: 2, total: 22 });
    const e = modeloHoy(ctxBase({ caminoId: "evangelios" }));
    expect(e.hero?.id.startsWith("mt-")).toBe(true);
    expect(e.hero?.total).toBe(47);
  });

  it("un camino desconocido o vacío cae en la Biblia", () => {
    expect(modeloHoy(ctxBase({ caminoId: "nada" })).camino.id).toBe("biblia");
  });

  it("si el siguiente no tiene audio lo dice y no salta al siguiente con audio", () => {
    const m = modeloHoy(ctxBase({ caminoId: "salmos", grabados: ["gn-01", "jn-01"] }));
    expect(m.estado).toBe("sin-audio");
    expect(m.hero).toMatchObject({ id: "sal-001", reproducible: false, dia: 1, total: 24 });
    const b = modeloHoy(ctxBase({ grabados: ["gn-01"], progress: { episodes: { "gn-01": { positionSeconds: 524, completed: true } }, listenedOn: [] } }));
    expect(b.estado).toBe("sin-audio");
    expect(b.hero?.id).toBe("gn-02");
  });

  it("camino completo no repite el primer episodio", () => {
    const ids = indice.rangos.filter((r) => r.bookId === "ap").map((r) => r.id);
    const episodes = Object.fromEntries(ids.map((id) => [id, { positionSeconds: 5, completed: true }]));
    const m = modeloHoy(ctxBase({ caminoId: "apocalipsis", progress: { episodes, listenedOn: [] } }));
    expect(m.estado).toBe("completado");
    expect(m.hero).toBeNull();
    expect(m.camino).toMatchObject({ hechos: 7, total: 7, fraccion: 1 });
  });

  it("retomar va en el hero y no se duplica en continuar", () => {
    const a = modeloHoy(ctxBase({ progress: { episodes: { "gn-01": { positionSeconds: 262.2, completed: false } }, listenedOn: [] } }));
    expect(a.hero).toMatchObject({ retomar: true });
    expect(a.hero?.fraccion).toBeCloseTo(0.5);
    expect(a.continuar).toBeNull();
    expect(a.historias.find((h) => h.id === "gn-01")).toBeUndefined();
  });

  it("continuar es un episodio distinto y con audio, y no se repite en historias", () => {
    const b = modeloHoy(ctxBase({ caminoId: "evangelios", progress: { episodes: { "gn-01": { positionSeconds: 100, completed: false, updatedAt: "2026-11-19T10:00:00Z" } }, listenedOn: [] } }));
    expect(b.hero?.id).not.toBe("gn-01");
    expect(b.continuar?.id).toBe("gn-01");
    expect(b.historias.find((h) => h.id === "gn-01")).toBeUndefined();
    const sinAudio = modeloHoy(ctxBase({ caminoId: "evangelios", grabados: ["jn-01"], progress: { episodes: { "gn-01": { positionSeconds: 100, completed: false } }, listenedOn: [] } }));
    expect(sinAudio.continuar).toBeNull();
  });

  it("historias salen solo de episodios con audio, sin el de hoy ni los completados, y sin obras repetidas", () => {
    const m = modeloHoy(ctxBase({ progress: { episodes: { "gn-02": { positionSeconds: 5, completed: true } }, listenedOn: [] } }));
    expect(m.hero?.id).toBe("gn-01");
    expect(m.historias.map((h) => h.id)).toEqual(["jn-01"]);
    const pintadas = [m.hero?.src, ...m.historias.map((h) => h.src)].filter(Boolean);
    expect(new Set(pintadas).size).toBe(pintadas.length);
    expect(m.obras).toHaveLength(new Set(m.obras).size);
    const todos = modeloHoy(ctxBase({ grabados: indice.episodes.map((e) => e.id) }));
    expect(todos.historias.length).toBeLessThanOrEqual(8);
    expect(todos.historias.find((h) => h.id === todos.hero?.id)).toBeUndefined();
  });

  it("no pinta ningún reto por calendario: los retos de Hoy salen solo de lo empezado", () => {
    const m = modeloHoy(ctxBase({ hoyIso: "2026-12-02" }));
    expect(Object.keys(m)).not.toContain("adviento");
    expect(m.obras.some((src) => src.includes("reto-adviento"))).toBe(false);
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

describe("etiqueta de episodio", () => {
  it("usa la etiqueta del catálogo y, sin ella, libro y rango", () => {
    const c = ctxBase();
    expect(infoEpisodio("gn-01", c).subtitulo).toBe("Génesis 1–2");
    expect(infoEpisodio("sal-001", c).subtitulo).toMatch(/^Salmos /);
  });
});
