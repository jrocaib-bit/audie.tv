import { describe, expect, it } from "vitest";
import {
  BLOQUES_HOY,
  CLAVE_PREFERENCIAS_HOY,
  PREFERENCIAS_INICIALES,
  alternarVisible,
  mover,
  ordenar,
  parsePreferenciasHoy,
  puedeMover,
  serializarPreferenciasHoy,
  visibles,
  type ListaOrdenada,
} from "./hoy-preferencias";

describe("preferencias de Hoy", () => {
  it("usa una clave propia y versionada", () => {
    expect(CLAVE_PREFERENCIAS_HOY).toBe("audite.hoy.preferencias.v1");
    expect(BLOQUES_HOY).toEqual(["camino", "en-curso", "continuar", "historias"]);
  });

  it("una entrada corrupta cae al valor por defecto", () => {
    for (const malo of [null, undefined, "", "{no", "[1,2]", 7, [], { version: 2, bloques: { orden: ["historias"] } }, "null"]) {
      expect(parsePreferenciasHoy(malo)).toEqual(PREFERENCIAS_INICIALES);
    }
  });

  it("limpia lo que no son identificadores y conserva lo válido", () => {
    const p = parsePreferenciasHoy(JSON.stringify({ version: 1, bloques: { orden: ["historias", 3, "historias", " ", "camino"], ocultos: "x" }, tarjetas: { ocultos: ["reto:a", null] } }));
    expect(p.bloques).toEqual({ orden: ["historias", "camino"], ocultos: [] });
    expect(p.tarjetas).toEqual({ orden: [], ocultos: ["reto:a"] });
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
