import { describe, expect, it } from "vitest";
import { capituloDePrueba, describirFuente, estadoTiempos, inicioDelPasaje, tiemposDeManifiesto, versiculoEnTiempo } from "./lectura";

describe("lectura", () => {
  it("entrega un capítulo ficticio y marcado, nunca texto con licencia", () => {
    const capitulo = capituloDePrueba("gn", 1, "es", undefined);
    expect(capitulo?.versiculos[0]?.marca).toBe("ficticio");
    expect(capitulo?.versiculos[0]?.texto).toMatch(/FIXTURE/);
    expect(capitulo?.aviso).toMatch(/no está en este repositorio/);
    expect(capituloDePrueba("gn", 2, "es", undefined)).toBeNull();
    expect(JSON.stringify(capitulo)).not.toMatch(/En el principio creó|Sagrada Biblia/);
  });

  it("no conecta el almacén privado aunque la dirección esté configurada", () => {
    expect(describirFuente(undefined).modo).toBe("fixture");
    expect(describirFuente("https://privado.example/texto").modo).toBe("remota-sin-conectar");
    expect(capituloDePrueba("gn", 1, "es", "https://privado.example/texto")).toBeNull();
  });

  it("resalta el versículo solo cuando el manifiesto trae tiempos", () => {
    expect(estadoTiempos([])).toBe("sin-tiempos");
    const tiempos = tiemposDeManifiesto([{ capitulo: 1, versiculo: 1, inicio: 0, fin: 4 }, { capitulo: 1, versiculo: 2, inicio: 4, fin: 9 }, { fin: 1 }]);
    expect(estadoTiempos(tiempos)).toBe("con-tiempos");
    expect(versiculoEnTiempo(tiempos, 5)?.versiculo).toBe(2);
    expect(versiculoEnTiempo([], 5)).toBeNull();
    expect(inicioDelPasaje(tiempos, 1, 2)).toBe(4);
    expect(inicioDelPasaje(tiempos, 1, 3, 3)).toBeNull();
    expect(inicioDelPasaje(null, 1, 1)).toBeNull();
  });
});
