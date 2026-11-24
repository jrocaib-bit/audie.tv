import { describe, expect, it } from "vitest";
import { validarTexto } from "./esquema";
import { mockDeBusqueda, simulacionActiva } from "./simulacion";

// Texto inventado.
const base = {
  version: 1,
  episodio: "gn-01",
  idioma: "es",
  muestra: true,
  fuente: "Fuente inventada",
  credito: "Crédito inventado",
  versiculos: [
    { ref: "1,1", cap: 1, v: "1", texto: "Frase inventada.", t: 0 },
    { ref: "1,5a", cap: 1, v: "5a", texto: "Otra frase inventada." },
  ],
};

describe("esquema del texto", () => {
  it("acepta el formato con t opcional y v como «5a»", () => {
    const texto = validarTexto(base, "gn-01", "es");
    expect(texto?.versiculos[1]?.v).toBe("5a");
  });

  it("es estricto con las claves", () => {
    expect(validarTexto({ ...base, extra: 1 }, "gn-01", "es")).toBeNull();
    expect(validarTexto({ ...base, versiculos: [{ ...base.versiculos[0], nota: "x" }] }, "gn-01", "es")).toBeNull();
  });

  it("rechaza valores fuera de forma", () => {
    expect(validarTexto({ ...base, version: 2 }, "gn-01", "es")).toBeNull();
    expect(validarTexto({ ...base, versiculos: [] }, "gn-01", "es")).toBeNull();
    expect(validarTexto({ ...base, versiculos: [{ ...base.versiculos[0], t: -1 }] }, "gn-01", "es")).toBeNull();
    expect(validarTexto({ ...base, versiculos: [{ ...base.versiculos[0], v: 5 }] }, "gn-01", "es")).toBeNull();
    expect(validarTexto({ ...base, versiculos: [{ ...base.versiculos[0], v: "5-" }] }, "gn-01", "es")).toBeNull();
    expect(validarTexto({ ...base, versiculos: [{ ...base.versiculos[0], v: "5-6-7" }] }, "gn-01", "es")).toBeNull();
    expect(validarTexto({ ...base, versiculos: [{ ...base.versiculos[0], texto: "" }] }, "gn-01", "es")).toBeNull();
    expect(validarTexto({ ...base, episodio: "../gn" }, "../gn", "es")).toBeNull();
    expect(validarTexto({ ...base, muestra: "si" }, "gn-01", "es")).toBeNull();
  });

  it("acepta la etiqueta de versículos agrupados, como 16-18", () => {
    expect(validarTexto({ ...base, versiculos: [{ ...base.versiculos[0], v: "16-18" }] }, "gn-01", "es")).not.toBeNull();
  });

  it("exige que el fichero sea del episodio y del idioma pedidos", () => {
    expect(validarTexto(base, "gn-02", "es")).toBeNull();
    expect(validarTexto(base, "gn-01", "en")).toBeNull();
  });
});

describe("simulación en desarrollo", () => {
  it("activa ?sim=1 solo fuera de producción", () => {
    expect(simulacionActiva("?sim=1", "development")).toBe(true);
    expect(simulacionActiva("?sim=1", "production")).toBe(false);
    expect(simulacionActiva("?sim=0", "development")).toBe(false);
    expect(simulacionActiva("", "development")).toBe(false);
  });

  it("reenvía el mock solo fuera de producción", () => {
    expect(mockDeBusqueda("?mock=premium", "development")).toBe("premium");
    expect(mockDeBusqueda("?mock=premium", "production")).toBeNull();
    expect(mockDeBusqueda("?mock=root", "development")).toBeNull();
  });
});
