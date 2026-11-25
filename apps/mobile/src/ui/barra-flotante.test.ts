import { describe, expect, it, vi } from "vitest";

vi.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

const { BARRA, huecoInferior, margenInferiorBarra } = await import("./barra-flotante");

describe("barra de pestañas flotante", () => {
  it("se separa del borde inferior aunque el sistema no reserve margen", () => {
    expect(margenInferiorBarra(0)).toBe(BARRA.margenInferiorMinimo);
    expect(margenInferiorBarra(34)).toBe(34);
  });
  it("el contenido de una pestaña reserva el alto de la píldora", () => {
    expect(huecoInferior({ pestanas: true, mini: false, insetInferior: 34 })).toBe(34 + BARRA.alto);
  });
  it("con el mini reproductor encima, reserva también su alto", () => {
    expect(huecoInferior({ pestanas: true, mini: true, insetInferior: 0 })).toBe(BARRA.margenInferiorMinimo + BARRA.alto + BARRA.separacionMini + BARRA.altoMini);
  });
  it("fuera de las pestañas solo cuenta el margen del sistema", () => {
    expect(huecoInferior({ pestanas: false, mini: true, insetInferior: 21 })).toBe(21);
  });
  it("las pestañas miden al menos 44 de alto dentro de la píldora", () => {
    expect(BARRA.alto).toBeGreaterThanOrEqual(52);
  });
});
