import { describe, expect, it } from "vitest";
import { parsePlanAviso, planVacio, proximosAvisos, textoAviso } from "./avisos";

describe("avisos locales", () => {
  it("escribe un texto sobrio con el libro y el capítulo", () => {
    expect(textoAviso("es", "Génesis", 3)).toBe("Te toca Génesis 3");
    expect(textoAviso("en", "Genesis", 3)).toBe("Next: Genesis 3");
    expect(textoAviso("es", "Génesis", 3)).not.toMatch(/oferta|gratis|compra/i);
  });

  it("solo programa los días elegidos y omite la hora ya pasada", () => {
    const ahora = new Date(2026, 10, 9, 10, 0, 0);
    const plan = { activo: true, hora: 9, minuto: 0, dias: [1] as const };
    const lunes = proximosAvisos({ ...plan, dias: [...plan.dias] }, ahora, "Te toca Génesis 3");
    expect(lunes).toHaveLength(1);
    expect(new Date(lunes[0]?.en ?? "").getDay()).toBe(1);
    expect(proximosAvisos(planVacio(), ahora, "Te toca Génesis 3")).toEqual([]);
  });

  it("rechaza horas imposibles y empieza desactivado", () => {
    expect(parsePlanAviso(null).activo).toBe(false);
    expect(parsePlanAviso({ activo: true, hora: 30, minuto: -1, dias: [1, 9, 1] })).toEqual({
      activo: true,
      hora: 8,
      minuto: 0,
      dias: [1],
    });
  });
});
