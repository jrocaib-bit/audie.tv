import { describe, expect, it } from "vitest";
import { repartirEstilo } from "./estilo";

describe("repartirEstilo", () => {
  it("el botón absoluto lleva posición y tamaño en la caja pulsable", () => {
    const { fuera, dentro } = repartirEstilo<Record<string, unknown>>([{ position: "absolute", right: 20, bottom: 28, width: 68, height: 68, borderRadius: 34, backgroundColor: "#c9a96e" }, false, undefined]);
    expect(fuera).toMatchObject({ position: "absolute", right: 20, bottom: 28, width: 68, height: 68 });
    expect(dentro).toMatchObject({ width: 68, height: 68, borderRadius: 34, backgroundColor: "#c9a96e" });
    expect(dentro).not.toHaveProperty("position");
    expect(fuera).not.toHaveProperty("backgroundColor");
  });
  it("los porcentajes rellenan la caja interior y el flex va en ambas", () => {
    const { fuera, dentro } = repartirEstilo<Record<string, unknown>>({ width: "100%", flex: 1, minHeight: 44, margin: 4, padding: 8 });
    expect(fuera).toMatchObject({ width: "100%", flex: 1, minHeight: 44, margin: 4 });
    expect(dentro).toMatchObject({ width: "100%", flex: 1, minHeight: 44, padding: 8 });
    expect(dentro).not.toHaveProperty("margin");
  });
});
