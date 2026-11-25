import { describe, expect, it } from "vitest";
import {
  BLOQUES_HOY,
  CLAVE_PREFERENCIAS_HOY,
  PREFERENCIAS_INICIALES,
  alternarVisible,
  mover,
  ordenar,
  parseHuella,
  parsePreferenciasHoy,
  puedeMover,
  quitadoDe,
  quitar,
  serializarPreferenciasHoy,
  visibles,
  volverAMostrar,
  type Huella,
  type ListaOrdenada,
} from "./hoy-preferencias";

describe("preferencias de Hoy", () => {
  it("usa una clave propia y versionada", () => {
    expect(CLAVE_PREFERENCIAS_HOY).toBe("audite.hoy.preferencias.v1");
    expect(BLOQUES_HOY).toEqual(["camino", "en-curso", "continuar", "historias"]);
  });

  it("una entrada corrupta cae al valor por defecto", () => {
    for (const malo of [null, undefined, "", "{no", "[1,2]", 7, [], { version: 3, bloques: { orden: ["historias"] } }, { version: "2" }, "null"]) {
      expect(parsePreferenciasHoy(malo)).toEqual(PREFERENCIAS_INICIALES);
    }
  });

  it("limpia lo que no son identificadores y conserva lo válido", () => {
    const p = parsePreferenciasHoy(JSON.stringify({ version: 1, bloques: { orden: ["historias", 3, "historias", " ", "camino"], ocultos: "x" }, tarjetas: { ocultos: ["reto:a", null] } }));
    expect(p.bloques).toEqual({ orden: ["historias", "camino"], ocultos: [] });
    expect(p.tarjetas).toEqual({ orden: [] });
    expect(p.quitados).toEqual([{ clave: "reto:a", huella: null, en: "" }]);
    expect(parsePreferenciasHoy(serializarPreferenciasHoy(p))).toEqual(p);
  });

  it("sin preferencias, el orden es el de por defecto y todo se ve", () => {
    expect(visibles(BLOQUES_HOY, PREFERENCIAS_INICIALES.bloques)).toEqual([...BLOQUES_HOY]);
  });

  it("oculta y vuelve a mostrar sin perder el sitio", () => {
    const oculto = alternarVisible(PREFERENCIAS_INICIALES.bloques, "continuar");
    expect(visibles(BLOQUES_HOY, oculto)).toEqual(["camino", "en-curso", "historias"]);
    expect(ordenar(BLOQUES_HOY, oculto)).toEqual([...BLOQUES_HOY]);
    expect(visibles(BLOQUES_HOY, alternarVisible(oculto, "continuar"))).toEqual([...BLOQUES_HOY]);
  });

  it("reordena con subir y bajar, y no se sale de los extremos", () => {
    let lista: ListaOrdenada = PREFERENCIAS_INICIALES.bloques;
    lista = mover(BLOQUES_HOY, lista, "historias", -1);
    lista = mover(BLOQUES_HOY, lista, "historias", -1);
    expect(visibles(BLOQUES_HOY, lista)).toEqual(["camino", "historias", "en-curso", "continuar"]);
    expect(mover(BLOQUES_HOY, lista, "camino", -1)).toBe(lista);
    expect(puedeMover(BLOQUES_HOY, lista, "camino")).toEqual({ subir: false, bajar: true });
    expect(puedeMover(BLOQUES_HOY, lista, "continuar")).toEqual({ subir: true, bajar: false });
  });

  it("un contenido empezado nuevo aparece visible al final de su grupo", () => {
    const guardado: ListaOrdenada = { orden: ["reto:b", "libro:exodo", "reto:a"], ocultos: ["reto:a"] };
    const disponibles = ["libro:exodo", "libro:nuevo", "reto:a", "reto:b", "reto:nuevo"];
    expect(ordenar(disponibles, guardado)).toEqual(["reto:b", "libro:exodo", "libro:nuevo", "reto:a", "reto:nuevo"]);
    expect(visibles(disponibles, guardado)).toEqual(["reto:b", "libro:exodo", "libro:nuevo", "reto:nuevo"]);
    expect(ordenar(["libro:solo"], { orden: ["reto:a"], ocultos: [] })).toEqual(["libro:solo"]);
  });

  it("lo que ya no está disponible no se pinta pero conserva su sitio guardado", () => {
    const guardado: ListaOrdenada = { orden: ["libro:viejo", "reto:a", "reto:b"], ocultos: ["libro:viejo"] };
    expect(visibles(["reto:a", "reto:b"], guardado)).toEqual(["reto:a", "reto:b"]);
    const movido = mover(["reto:a", "reto:b"], guardado, "reto:b", -1);
    expect(movido.orden).toEqual(["reto:b", "reto:a", "libro:viejo"]);
    expect(movido.ocultos).toEqual(["libro:viejo"]);
  });
});

describe("preferencias viejas y quitar de Hoy", () => {
  const huellaLibro: Huella = { tipo: "libro", capituloId: "c2", bloqueId: "b7", ratio: null, actualizado: "2026-11-24T10:00:00Z" };
  const huellaReto: Huella = { tipo: "reto", hechos: 2, episodios: { "x-01": { s: 600, c: true }, "x-02": { s: 600, c: true }, "x-03": { s: 30, c: false } }, actualizado: "2026-11-24T10:00:00Z" };

  it("lee la versión 1 guardada: conserva bloques y orden, y sus tarjetas ocultas pasan a quitadas sin huella", () => {
    const v1 = {
      version: 1,
      bloques: { orden: ["en-curso", "camino", "continuar", "historias"], ocultos: ["continuar"] },
      tarjetas: { orden: ["reto:ordinario-salmos", "libro:genesis"], ocultos: ["libro:genesis"] },
    };
    const p = parsePreferenciasHoy(JSON.stringify(v1));
    expect(p).toEqual({
      version: 2,
      bloques: v1.bloques,
      tarjetas: { orden: ["reto:ordinario-salmos", "libro:genesis"] },
      quitados: [{ clave: "libro:genesis", huella: null, en: "" }],
    });
    expect(JSON.parse(serializarPreferenciasHoy(p)).version).toBe(2);
    expect(parsePreferenciasHoy(serializarPreferenciasHoy(p))).toEqual(p);
  });

  it("la versión 1 sin tarjetas ni bloques da listas vacías", () => {
    expect(parsePreferenciasHoy({ version: 1 })).toEqual(PREFERENCIAS_INICIALES);
  });

  it("quitar guarda la huella y volver a mostrar la borra", () => {
    let p = quitar(PREFERENCIAS_INICIALES, "libro:genesis", huellaLibro, "2026-11-25T09:00:00Z");
    p = quitar(p, "reto:a", huellaReto, "2026-11-25T09:01:00Z");
    expect(quitadoDe(p, "libro:genesis")).toEqual({ clave: "libro:genesis", huella: huellaLibro, en: "2026-11-25T09:00:00Z" });
    expect(parsePreferenciasHoy(serializarPreferenciasHoy(p))).toEqual(p);
    const otra = quitar(p, "libro:genesis", { ...huellaLibro, capituloId: "c3" }, "2026-11-25T10:00:00Z");
    expect(otra.quitados.map((q) => q.clave)).toEqual(["reto:a", "libro:genesis"]);
    expect(quitadoDe(otra, "libro:genesis")?.huella).toMatchObject({ capituloId: "c3" });
    const vuelta = volverAMostrar(p, "libro:genesis");
    expect(quitadoDe(vuelta, "libro:genesis")).toBeUndefined();
    expect(vuelta.quitados.map((q) => q.clave)).toEqual(["reto:a"]);
  });

  it("una huella que no encaja se lee como null y la entrada sigue quitada", () => {
    expect(parseHuella({ tipo: "libro" })).toBeNull();
    expect(parseHuella({ tipo: "reto", hechos: -1 })).toBeNull();
    expect(parseHuella("x")).toBeNull();
    expect(parseHuella({ tipo: "reto", hechos: 1, episodios: { a: { s: "x", c: 1 }, b: 3 } })).toEqual({ tipo: "reto", hechos: 1, episodios: { a: { s: 0, c: false } }, actualizado: "" });
    const p = parsePreferenciasHoy({ version: 2, quitados: [{ clave: "libro:x", huella: { tipo: "otro" } }, { clave: "libro:x" }, { clave: 4 }, "y"] });
    expect(p.quitados).toEqual([{ clave: "libro:x", huella: null, en: "" }]);
  });
});
