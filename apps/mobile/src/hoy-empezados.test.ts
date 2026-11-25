import { describe, expect, it } from "vitest";
import {
  UMBRAL_FINAL_LIBRO,
  avanceLibro,
  estadoEnCurso,
  hayAvanceNuevo,
  huellaDe,
  libroIdDeClave,
  librosEnCurso,
  repartirEnCurso,
  retosEnCurso,
  tarjetasEnCurso,
  type InfoLibro,
} from "./hoy-empezados";
import { PREFERENCIAS_INICIALES, parsePreferenciasHoy, quitar, serializarPreferenciasHoy, volverAMostrar, type PreferenciasHoy } from "./hoy-preferencias";
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

  it("la bibliografía no cuenta como capítulo y llegar a ella termina el libro", () => {
    const real = [{ id: "prologo", tipo: "prologo" }, { id: "capitulo-01", tipo: "capitulo" }, { id: "epilogo", tipo: "epilogo" }, { id: "bibliografia", tipo: "bibliografia" }];
    expect(avanceLibro({ capitulo_id: "capitulo-01", ratio: null }, real)).toMatchObject({ capitulo: 2, total: 3, terminado: false });
    expect(avanceLibro({ capitulo_id: "epilogo", ratio: null }, real)).toMatchObject({ capitulo: 3, total: 3, terminado: false });
    expect(avanceLibro({ capitulo_id: "epilogo", ratio: 0.99 }, real).terminado).toBe(true);
    expect(avanceLibro({ capitulo_id: "bibliografia", ratio: null }, real)).toEqual({ capitulo: 3, total: 3, fraccion: 1, terminado: true });
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

describe("quitar de Hoy y reaparecer al avanzar", () => {
  const leer = (capitulo: string, updated_at: string, bloque: string | null = null, ratio: number | null = null) =>
    librosEnCurso([{ libroId: "genesis", anotaciones: { progreso: { libro_id: "genesis", capitulo_id: capitulo, bloque_id: bloque, ratio, updated_at } } }], infoDe);
  const reto = { id: "a", titulo: "A", src: "", pasos: [{ dia: 1, episodio: "x-01" }, { dia: 2, episodio: "x-02" }, { dia: 3, episodio: "x-03" }] };
  const escuchar = (episodes: Record<string, { positionSeconds: number; completed: boolean; updatedAt: string }>) => retosEnCurso([reto], { episodes });
  const ver = (tarjetas: ReturnType<typeof tarjetasEnCurso>, p: PreferenciasHoy) => {
    const r = repartirEnCurso(tarjetas, p);
    return { visibles: r.visibles.map((x) => x.clave), quitadas: r.quitadas.map((x) => x.clave) };
  };
  /** Quita cada tarjeta y pasa por el almacenamiento, como hace la app. */
  const quitarYGuardar = (tarjetas: ReturnType<typeof tarjetasEnCurso>, claves: string[]) => {
    let p: PreferenciasHoy = PREFERENCIAS_INICIALES;
    for (const x of tarjetas.filter((t) => claves.includes(t.clave))) p = quitar(p, x.clave, huellaDe(x), "2026-11-25T09:00:00Z");
    return parsePreferenciasHoy(serializarPreferenciasHoy(p));
  };

  it("la huella guarda capítulo, bloque, ratio y fecha del libro, y pasos y episodios del reto", () => {
    const [libro] = tarjetasEnCurso(leer("c1", "2026-11-24T10:00:00Z", "b3", 0.4), []);
    expect(huellaDe(libro!)).toEqual({ tipo: "libro", capituloId: "c1", bloqueId: "b3", ratio: 0.4, actualizado: "2026-11-24T10:00:00Z" });
    const [r] = tarjetasEnCurso([], escuchar({ "x-01": { positionSeconds: 600, completed: true, updatedAt: "2026-11-24T10:00:00Z" } }));
    expect(huellaDe(r!)).toEqual({ tipo: "reto", hechos: 1, episodios: { "x-01": { s: 600, c: true }, "x-02": { s: 0, c: false }, "x-03": { s: 0, c: false } }, actualizado: "2026-11-24T10:00:00Z" });
  });

  it("quitar saca la tarjeta de Hoy, la lleva a lo quitado y no toca el progreso", () => {
    const libros = leer("c1", "2026-11-24T10:00:00Z", "b3");
    const retos = escuchar({ "x-01": { positionSeconds: 600, completed: true, updatedAt: "2026-11-24T11:00:00Z" } });
    const tarjetas = tarjetasEnCurso(libros, retos);
    const p = quitarYGuardar(tarjetas, ["libro:genesis"]);
    expect(ver(tarjetas, p)).toEqual({ visibles: ["reto:a"], quitadas: ["libro:genesis"] });
    expect(libros[0]).toMatchObject({ capituloId: "c1", bloqueId: "b3", actualizado: "2026-11-24T10:00:00Z" });
    expect(estadoEnCurso(tarjetas.length, 1)).toBe("lista");
    const todo = quitarYGuardar(tarjetas, ["libro:genesis", "reto:a"]);
    expect(ver(tarjetas, todo).visibles).toEqual([]);
    expect(estadoEnCurso(tarjetas.length, 0)).toBe("oculto");
  });

  it("sin avance nuevo el libro sigue quitado, aunque se relea el mismo punto o llegue una fecha vieja", () => {
    const antes = tarjetasEnCurso(leer("c1", "2026-11-24T10:00:00Z", "b3"), []);
    const p = quitarYGuardar(antes, ["libro:genesis"]);
    expect(ver(tarjetasEnCurso(leer("c1", "2026-11-24T10:00:00Z", "b3"), []), p).quitadas).toEqual(["libro:genesis"]);
    expect(ver(tarjetasEnCurso(leer("c1", "2026-11-26T10:00:00Z", "b3"), []), p).quitadas).toEqual(["libro:genesis"]);
    expect(ver(tarjetasEnCurso(leer("c2", "2026-11-20T10:00:00Z"), []), p).quitadas).toEqual(["libro:genesis"]);
  });

  it("el libro reaparece solo cuando su avance cambia y es más reciente", () => {
    const p = quitarYGuardar(tarjetasEnCurso(leer("c1", "2026-11-24T10:00:00Z", "b3"), []), ["libro:genesis"]);
    expect(ver(tarjetasEnCurso(leer("c2", "2026-11-25T10:00:00Z"), []), p)).toEqual({ visibles: ["libro:genesis"], quitadas: [] });
    expect(ver(tarjetasEnCurso(leer("c1", "2026-11-25T10:00:00Z", "b9"), []), p).visibles).toEqual(["libro:genesis"]);
    expect(ver(tarjetasEnCurso(leer("c1", "2026-11-25T10:00:00Z", "b3", 0.5), []), p).visibles).toEqual(["libro:genesis"]);
  });

  it("sin avance nuevo el reto sigue quitado", () => {
    const avance = { "x-01": { positionSeconds: 600, completed: true, updatedAt: "2026-11-24T10:00:00Z" }, "x-02": { positionSeconds: 90, completed: false, updatedAt: "2026-11-24T11:00:00Z" } };
    const p = quitarYGuardar(tarjetasEnCurso([], escuchar(avance)), ["reto:a"]);
    expect(ver(tarjetasEnCurso([], escuchar(avance)), p)).toEqual({ visibles: [], quitadas: ["reto:a"] });
    const viejo = { ...avance, "x-02": { positionSeconds: 120, completed: false, updatedAt: "2026-11-23T10:00:00Z" } };
    expect(ver(tarjetasEnCurso([], escuchar(viejo)), p).quitadas).toEqual(["reto:a"]);
  });

  it("el reto reaparece con un paso más hecho o con más escucha reciente de un episodio suyo", () => {
    const avance = { "x-01": { positionSeconds: 600, completed: true, updatedAt: "2026-11-24T10:00:00Z" } };
    const p = quitarYGuardar(tarjetasEnCurso([], escuchar(avance)), ["reto:a"]);
    const paso = { ...avance, "x-02": { positionSeconds: 600, completed: true, updatedAt: "2026-11-25T10:00:00Z" } };
    expect(ver(tarjetasEnCurso([], escuchar(paso)), p)).toEqual({ visibles: ["reto:a"], quitadas: [] });
    const escucha = { ...avance, "x-02": { positionSeconds: 45, completed: false, updatedAt: "2026-11-25T10:00:00Z" } };
    expect(ver(tarjetasEnCurso([], escuchar(escucha)), p).visibles).toEqual(["reto:a"]);
  });

  it("volver a mostrar devuelve la tarjeta a su sitio", () => {
    const tarjetas = tarjetasEnCurso(leer("c1", "2026-11-24T10:00:00Z"), escuchar({ "x-01": { positionSeconds: 600, completed: true, updatedAt: "2026-11-24T10:00:00Z" } }));
    const p = quitarYGuardar(tarjetas, ["libro:genesis"]);
    expect(ver(tarjetas, volverAMostrar(p, "libro:genesis"))).toEqual({ visibles: ["libro:genesis", "reto:a"], quitadas: [] });
  });

  it("lo ocultado con la versión 1 sigue quitado sin huella hasta volver a mostrarlo", () => {
    const p = parsePreferenciasHoy(JSON.stringify({ version: 1, tarjetas: { orden: [], ocultos: ["libro:genesis"] } }));
    expect(ver(tarjetasEnCurso(leer("c3", "2027-01-01T10:00:00Z"), []), p).quitadas).toEqual(["libro:genesis"]);
    expect(ver(tarjetasEnCurso(leer("c3", "2027-01-01T10:00:00Z"), []), volverAMostrar(p, "libro:genesis")).visibles).toEqual(["libro:genesis"]);
  });

  it("una huella de otro tipo cuenta como avance nuevo", () => {
    const [libro] = tarjetasEnCurso(leer("c1", "2026-11-24T10:00:00Z"), []);
    expect(hayAvanceNuevo({ tipo: "reto", hechos: 0, episodios: {}, actualizado: "" }, libro!)).toBe(true);
  });
});
