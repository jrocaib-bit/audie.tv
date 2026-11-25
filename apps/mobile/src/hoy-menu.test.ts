import { describe, expect, it } from "vitest";
import { opcionesMenu } from "./hoy-menu";

describe("menú contextual de Hoy", () => {
  it("un libro sin fijar ofrece fijar, ir al libro, editar Hoy y quitar", () => {
    expect(opcionesMenu({ tipo: "libro", fijado: false })).toEqual(["fijar", "ir-libro", "editar-hoy", "quitar"]);
  });

  it("un reto fijado ofrece desfijar e ir al reto", () => {
    expect(opcionesMenu({ tipo: "reto", fijado: true })).toEqual(["desfijar", "ir-reto", "editar-hoy", "quitar"]);
    expect(opcionesMenu({ tipo: "reto", fijado: false })[0]).toBe("fijar");
  });

  it("el episodio de hoy ofrece ver el camino, editar Hoy y quitar, sin fijar", () => {
    const opciones = opcionesMenu({ tipo: "episodio" });
    expect(opciones).toEqual(["ver-camino", "editar-hoy", "quitar"]);
    expect(opciones).not.toContain("fijar");
  });

  it("quitar va siempre la última y nunca se ofrece marcar como terminado", () => {
    for (const destino of [{ tipo: "libro", fijado: true }, { tipo: "reto", fijado: false }, { tipo: "episodio" }] as const) {
      const opciones = opcionesMenu(destino);
      expect(opciones.at(-1)).toBe("quitar");
      expect(new Set(opciones).size).toBe(opciones.length);
      expect(opciones as string[]).not.toContain("terminar");
    }
  });
});
