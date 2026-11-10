import { describe, expect, it } from "vitest";
import { pruebaSocial } from "./prueba-social";

describe("prueba social", () => {
  it("usa el recuento que le pasan y omite las obras si no hay", () => {
    expect(pruebaSocial({ episodios: 516, obras: 4, idiomas: 7 }, "es")).toBe("516 episodios · 4 obras · 7 idiomas");
    expect(pruebaSocial({ episodios: 516, obras: 4, idiomas: 7 }, "en")).toBe("516 episodes · 4 works · 7 languages");
    expect(pruebaSocial({ episodios: 516, obras: null, idiomas: 7 }, "es")).toBe("516 episodios · 7 idiomas");
    expect(pruebaSocial({ episodios: 516, obras: 0, idiomas: 7 }, "es")).toBe("516 episodios · 7 idiomas");
    expect(pruebaSocial({ episodios: 516, idiomas: 7 }, "es")).not.toMatch(/obra|oyente|usuario/i);
  });
});
