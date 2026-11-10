import { describe, expect, it } from "vitest";
import { pruebaSocial } from "./prueba-social";

describe("prueba social", () => {
  it("usa el recuento que le pasan y omite las obras si no hay", () => {
    expect(pruebaSocial({ episodios: 516, obras: 4 }, "es")).toBe("516 episodios · 4 obras");
    expect(pruebaSocial({ episodios: 516, obras: 4 }, "en")).toBe("516 episodes · 4 works");
    expect(pruebaSocial({ episodios: 516 }, "es")).toBe("516 episodios");
    expect(pruebaSocial({ episodios: 516 }, "es")).not.toMatch(/idiomas|oyente|usuario/i);
  });
});
