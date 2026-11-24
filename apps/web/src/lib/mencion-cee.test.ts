import { describe, expect, it } from "vitest";
import { lineaCee, mencionCeeActiva } from "./mencion-cee";

describe("mención de la CEE", () => {
  it("está apagada salvo que el valor sea exactamente true", () => {
    expect(mencionCeeActiva(undefined)).toBe(false);
    expect(mencionCeeActiva("")).toBe(false);
    expect(mencionCeeActiva("1")).toBe(false);
    expect(mencionCeeActiva("TRUE")).toBe(false);
    expect(mencionCeeActiva("false")).toBe(false);
    expect(mencionCeeActiva("true")).toBe(true);
  });

  it("la línea solo sale con el interruptor encendido", () => {
    expect(lineaCee("es", false)).toBeNull();
    expect(lineaCee("en", false)).toBeNull();
    expect(lineaCee("es", true)).toContain("Conferencia Episcopal");
    expect((lineaCee("es", true) ?? "").length).toBeLessThan(140);
  });
});
