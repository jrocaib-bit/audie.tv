import { describe, expect, it } from "vitest";
import { SALTO_SEGUNDOS, metadatosReproduccion, posicionTrasSalto } from "./sesion-media";

describe("sesión de medios", () => {
  it("prepara título, libro y carátula para el sistema", () => {
    const meta = metadatosReproduccion({
      titulo: " En el principio ",
      libro: "Génesis",
      caratula: "/obras/gn-01.webp",
      duracion: 48,
      posicion: 60,
      velocidad: 1,
    });
    expect(meta.titulo).toBe("En el principio");
    expect(meta.libro).toBe("Génesis");
    expect(meta.artista).toBe("Audite");
    expect(meta.caratula).toBe("/obras/gn-01.webp");
    expect(meta.posicion).toBe(48);
  });

  it("salta quince segundos sin salir del audio", () => {
    expect(posicionTrasSalto(10, -SALTO_SEGUNDOS, 48)).toBe(0);
    expect(posicionTrasSalto(10, SALTO_SEGUNDOS, 48)).toBe(25);
    expect(posicionTrasSalto(40, SALTO_SEGUNDOS, 48)).toBe(48);
  });
});
