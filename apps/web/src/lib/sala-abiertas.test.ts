import { describe, expect, it } from "vitest";
import { esObraSalaAbierta, OBRAS_SALA_ABIERTAS } from "./sala-abiertas";

describe("obras abiertas de La sala", () => {
  it("por defecto son gn-01, gn-07 e is-18", () => {
    expect([...OBRAS_SALA_ABIERTAS]).toEqual(["gn-01", "gn-07", "is-18"]);
    for (const id of OBRAS_SALA_ABIERTAS) expect(esObraSalaAbierta(id)).toBe(true);
    expect(esObraSalaAbierta("gn-02")).toBe(false);
    expect(esObraSalaAbierta("gn-10")).toBe(false);
  });
});
