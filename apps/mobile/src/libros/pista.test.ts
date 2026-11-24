import { describe, expect, it } from "vitest";
import { CLAVE_PISTA, TEXTO_PISTA, mostrarPista, pistaVista, recordarPista, vaiven } from "./pista";

const mem = () => {
  const d = new Map<string, string>();
  return { getItem: async (k: string) => d.get(k) ?? null, setItem: async (k: string, v: string) => void d.set(k, v) };
};

describe("pista de primera visita", () => {
  it("el texto es el pedido", () => expect(TEXTO_PISTA).toBe("Toca un libro para abrirlo"));
  it("sale hasta el primer toque y queda recordada", async () => {
    const a = mem();
    expect(await pistaVista(a)).toBe(false);
    await recordarPista(a);
    expect(await a.getItem(CLAVE_PISTA)).toBe("1");
    expect(await pistaVista(a)).toBe(true);
  });
  it("no se muestra mientras no se sabe si ya se vio ni sin lomos", () => {
    expect(mostrarPista(null, true)).toBe(false);
    expect(mostrarPista(false, false)).toBe(false);
    expect(mostrarPista(false, true)).toBe(true);
    expect(mostrarPista(true, true)).toBe(false);
  });
  it("con movimiento reducido no hay vaivén", () => {
    expect(vaiven(true)).toEqual([0]);
    expect(vaiven(false).length).toBeGreaterThan(2);
  });
});
