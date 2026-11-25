import { describe, expect, it } from "vitest";
import {
  UMBRAL_FINAL_LIBRO,
  avanceLibro,
  estadoEnCurso,
  libroIdDeClave,
  librosEnCurso,
  retosEnCurso,
  tarjetasEnCurso,
  type InfoLibro,
} from "./hoy-empezados";
import { RETOS_APP } from "./retos-app";

const indice = [{ id: "prologo" }, { id: "c1" }, { id: "c2" }, { id: "c3" }];
const info: Record<string, InfoLibro> = {
  genesis: { slug: "genesis", titulo: "Génesis comentado", volumen: 1, indice },
  exodo: { slug: "exodo", titulo: "Éxodo comentado", volumen: 2, indice },
  salmos: { slug: "salmos", titulo: "Salmos comentados", volumen: 5, indice },
  rut: { slug: "rut", titulo: "Rut comentado", volumen: 7, indice },
};
const infoDe = (id: string) => info[id] ?? null;
const progreso = (libro_id: string, capitulo_id: string, updated_at: string, ratio: number | null = null) => ({
  libroId: libro_id,
  anotaciones: { progreso: { libro_id, capitulo_id, bloque_id: null, ratio, updated_at } },
});

describe("libros empezados", () => {
  it("reconoce solo las claves de anotaciones por libro", () => {
    expect(libroIdDeClave("audite.libros.v1.genesis")).toBe("genesis");
    expect(libroIdDeClave("audite.libros.ajustes.v1")).toBeNull();
    expect(libroIdDeClave("audite.libros.medidas.v1.genesis.c1.2.390")).toBeNull();
    expect(libroIdDeClave("audite.libros.cache.v2.libro.genesis")).toBeNull();
    expect(libroIdDeClave("audite.libros.v1.")).toBeNull();
  });

  it("calcula capítulo, total y fracción, y el límite de terminado", () => {
    expect(avanceLibro({ capitulo_id: "c1", ratio: null }, indice)).toEqual({ capitulo: 2, total: 4, fraccion: 1.5 / 4, terminado: false });
    expect(avanceLibro({ capitulo_id: "c3", ratio: null }, indice).terminado).toBe(false);
    expect(avanceLibro({ capitulo_id: "c3", ratio: UMBRAL_FINAL_LIBRO - 0.01 }, indice).terminado).toBe(false);
    expect(avanceLibro({ capitulo_id: "c3", ratio: UMBRAL_FINAL_LIBRO }, indice).terminado).toBe(true);
    expect(avanceLibro({ capitulo_id: "c3", ratio: 1 }, indice)).toMatchObject({ capitulo: 4, fraccion: 1, terminado: true });
    expect(avanceLibro({ capitulo_id: "c2", ratio: 1 }, indice).terminado).toBe(false);
    expect(avanceLibro({ capitulo_id: "otro", ratio: 1 }, indice)).toEqual({ capitulo: 0, total: 4, fraccion: 0, terminado: false });
    expect(avanceLibro({ capitulo_id: "c1", ratio: 7 }, [])).toMatchObject({ total: 0, terminado: false });
  });

  it("lista varios a la vez, ignora terminados, sin progreso y desconocidos, y ordena por la lectura más reciente", () => {
    const lista = librosEnCurso(
      [
        progreso("genesis", "c1", "2026-11-20T10:00:00Z"),
        progreso("exodo", "c2", "2026-11-24T10:00:00Z", 0.3),
        progreso("salmos", "c3", "2026-11-25T08:00:00Z", 0.99),
        { libroId: "rut", anotaciones: { progreso: null } },
        progreso("desconocido", "c1", "2026-11-25T09:00:00Z"),
      ],
      infoDe,
    );
    expect(lista.map((l) => l.slug)).toEqual(["exodo", "genesis"]);
    expect(lista[0]).toMatchObject({ clave: "libro:exodo", titulo: "Éxodo comentado", capitulo: 3, total: 4, volumen: 2 });
    expect(lista[0]!.fraccion).toBeCloseTo(2.3 / 4);
  });

  it("a igual fecha el orden es estable por identificador", () => {
    const misma = "2026-11-20T10:00:00Z";
    const a = librosEnCurso([progreso("genesis", "c1", misma), progreso("exodo", "c1", misma)], infoDe);
    const b = librosEnCurso([progreso("exodo", "c1", misma), progreso("genesis", "c1", misma)], infoDe);
    expect(a.map((l) => l.slug)).toEqual(["exodo", "genesis"]);
    expect(b.map((l) => l.slug)).toEqual(["exodo", "genesis"]);
  });
});

describe("retos empezados", () => {
  const retos = [
    { id: "a", titulo: "A", src: "/a.webp", pasos: [{ dia: 1, episodio: "x-01" }, { dia: 2, episodio: "x-02" }, { dia: 3, episodio: "x-03" }] },
    { id: "b", titulo: "B", src: "/b.webp", pasos: [{ dia: 1, episodio: "y-01" }, { dia: 2, episodio: "y-02" }] },
    { id: "c", titulo: "C", src: "", sinObra: true, pasos: [{ dia: 1, episodio: "z-01" }, { dia: 2, episodio: "z-02" }] },
    { id: "d", titulo: "D", src: "/d.webp", pasos: [{ dia: 1, episodio: "w-01" }] },
    { id: "vacio", titulo: "Vacío", src: "", pasos: [] },
  ];

  it("lista varios a la vez con día y fracción, e ignora los no empezados y los completados", () => {
    const lista = retosEnCurso(retos, {
      episodes: {
        "x-01": { positionSeconds: 300, completed: true, updatedAt: "2026-11-22T10:00:00Z" },
        "y-01": { positionSeconds: 40, completed: false, updatedAt: "2026-11-24T10:00:00Z" },
        "w-01": { positionSeconds: 300, completed: true, updatedAt: "2026-11-25T10:00:00Z" },
      },
    });
    expect(lista.map((r) => r.id)).toEqual(["b", "a"]);
    expect(lista[0]).toMatchObject({ clave: "reto:b", hechos: 0, total: 2, fraccion: 0, dia: 1, siguiente: "y-01" });
    expect(lista[1]).toMatchObject({ clave: "reto:a", hechos: 1, total: 3, dia: 2, siguiente: "x-02" });
    expect(lista[1]!.fraccion).toBeCloseTo(1 / 3);
  });

  it("un reto sin avance no aparece aunque esté en su calendario", () => {
    expect(retosEnCurso(retos, { episodes: {} })).toEqual([]);
    expect(retosEnCurso(retos, { episodes: { "x-01": { positionSeconds: 0, completed: false } } })).toEqual([]);
  });

  it("cuenta los pasos que repiten episodio como hace el modelo de retos", () => {
    const navidad = RETOS_APP.find((r) => r.id === "navidad-infancia")!;
    const lista = retosEnCurso([{ id: navidad.id, titulo: "Navidad", src: "", pasos: navidad.pasos }], {
      episodes: { "lc-01": { positionSeconds: 600, completed: true, updatedAt: "2026-11-25T10:00:00Z" } },
    });
    const repetidos = navidad.pasos.filter((p) => p.episodio === "lc-01").length;
    expect(lista[0]).toMatchObject({ hechos: repetidos, total: navidad.pasos.length, dia: navidad.pasos[repetidos]!.dia });
  });
});

describe("sección en curso", () => {
  it("pone primero los libros y después los retos", () => {
    const libros = librosEnCurso([progreso("genesis", "c1", "2026-11-20T10:00:00Z")], infoDe);
    const retos = retosEnCurso([{ id: "a", titulo: "A", src: "", pasos: [{ dia: 1, episodio: "x-01" }, { dia: 2, episodio: "x-02" }] }], {
      episodes: { "x-01": { positionSeconds: 1, completed: true, updatedAt: "2026-11-25T10:00:00Z" } },
    });
    expect(tarjetasEnCurso(libros, retos).map((t) => `${t.tipo}:${t.clave}`)).toEqual(["libro:libro:genesis", "reto:reto:a"]);
  });

  it("distingue vacío, todo oculto y lista", () => {
    expect(estadoEnCurso(0, 0)).toBe("vacio");
    expect(estadoEnCurso(3, 0)).toBe("oculto");
    expect(estadoEnCurso(3, 1)).toBe("lista");
    expect(tarjetasEnCurso([], [])).toEqual([]);
  });
});
