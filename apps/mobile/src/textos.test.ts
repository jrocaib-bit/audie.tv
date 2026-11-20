import { describe, expect, it } from "vitest";
import { tx } from "./textos";

describe("textos", () => {
  it("es y en tienen las mismas claves y ninguna vacía", () => {
    expect(Object.keys(tx("en")).sort()).toEqual(Object.keys(tx("es")).sort());
    for (const lang of ["es", "en"] as const) for (const valor of Object.values(tx(lang))) expect(valor.trim().length).toBeGreaterThan(0);
  });
  it("el microcopy es corto: nada de frases largas", () => {
    for (const lang of ["es", "en"] as const) for (const valor of Object.values(tx(lang))) expect(valor.length).toBeLessThanOrEqual(24);
  });
});
