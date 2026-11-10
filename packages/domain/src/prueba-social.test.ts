import { describe, expect, it } from "vitest";
import { pruebaSocial } from "./prueba-social";

describe("prueba social", () => {
  it("solo nombra episodios, obras e idiomas", () => {
    expect(pruebaSocial({ episodios: 516, obras: 22, idiomas: 7 }, "es")).toBe("516 episodios · 22 obras · 7 idiomas");
    expect(pruebaSocial({ episodios: 516, obras: 22, idiomas: 7 }, "en")).toBe("516 episodes · 22 works · 7 languages");
    expect(pruebaSocial({ episodios: 516, obras: 22, idiomas: 7 }, "es")).not.toMatch(/oyente|usuario|descarga/i);
  });
});
