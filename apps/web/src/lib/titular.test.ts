import { describe, expect, it } from "vitest";
import { datosTitular } from "./titular";

describe("datos del titular", () => {
  it("deja los huecos visibles si las variables no están", () => {
    const vacio = datosTitular({});
    const blancos = datosTitular({ nif: "  ", direccion: " \n " });
    expect(vacio.nif).toBe("[NIF]");
    expect(vacio.direccion).toBe("[DIRECCIÓN]");
    expect(blancos.nif).toBe("[NIF]");
    expect(blancos.direccion).toBe("[DIRECCIÓN]");
    expect(vacio.nombre).toBe("Francisco Javier Roca Ibáñez");
    expect(vacio.contacto).toBe("soporte@audite.tv");
  });
});
