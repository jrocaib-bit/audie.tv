import { describe, expect, it } from "vitest";
import { bucleDe, medidasHueco } from "./bucles";
import { creditoObraReto } from "./credito-obra";

const json = JSON.stringify({
  "reto:adviento-isaias": { mp4: "https://signed.example/cleve.mp4", poster: "https://signed.example/cleve.webp", aspect: "16/9" },
  "reto:adviento-isaias:o1": { mp4: "https://signed.example/hicks.mp4", poster: "https://signed.example/hicks.webp", aspect: "4/3", alt: "El reino pacífico" },
});

describe("bucle de Hicks en la app", () => {
  it("no devuelve o1 si la clave no está", () => {
    expect(bucleDe("reto:adviento-isaias:o1", "")).toBeNull();
    expect(bucleDe("reto:adviento-isaias:o1", "{")).toBeNull();
    expect(bucleDe("reto:adviento-isaias:o1", JSON.stringify({ "reto:adviento-isaias": { mp4: "https://signed.example/cleve.mp4" } }))).toBeNull();
  });

  it("lee o1 con su proporción y reserva como máximo el 70% del alto", () => {
    const bucle = bucleDe("reto:adviento-isaias:o1", json);
    expect(bucle?.poster).toBe("https://signed.example/hicks.webp");
    expect(bucle?.aspect).toBe("4/3");
    const caja = medidasHueco("4/3", 390, 800);
    expect(caja.height).toBeLessThanOrEqual(800 * 0.7);
    expect(caja.width / caja.height).toBeCloseTo(4 / 3, 5);
    const alto = medidasHueco("4/5", 390, 400);
    expect(alto.height).toBeCloseTo(280, 5);
    expect(alto.width / alto.height).toBeCloseTo(4 / 5, 5);
    expect(creditoObraReto("reto-adviento_o1", "es")).toBe("El reino pacífico · Edward Hicks");
    expect(creditoObraReto("reto-adviento_o1", "en")).toBe("Peaceable Kingdom · Edward Hicks");
    expect(creditoObraReto("no-existe")).toBe("");
  });
});
