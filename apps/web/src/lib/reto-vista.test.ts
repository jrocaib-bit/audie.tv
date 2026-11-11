import { loadAppCatalog } from "@audite/content/app-catalog";
import { describe, expect, it } from "vitest";
import { esAudioGratis, esRetoConCuenta } from "@/lib/audio-acceso";
import { modeloDeReto } from "@/lib/reto-vista";
import { retoDeTemporada } from "@/lib/retos-anio";
import { destinoTrasEntrar, hrefEntrar, rutaDeVuelta } from "@/lib/vuelta";

describe("vista de un reto", () => {
  const rangos = loadAppCatalog().rangos;
  const adviento = retoDeTemporada("adviento-isaias");

  it("pinta cada día con su cuadro, sin repetir, y marca el de hoy", () => {
    expect(adviento).toBeTruthy();
    const modelo = modeloDeReto(adviento!, rangos, "es", "2026-11-29");
    expect(modelo.titulo).toBe("Adviento con Isaías");
    expect(modelo.dias[0]?.episodio).toBe("is-01");
    expect(modelo.dias[0]?.audio).toBe(true);
    expect(modelo.dias[0]?.src).toBeTruthy();
    expect(modelo.dias[0]?.hoy).toBe(true);
    expect(modelo.dias.filter((dia) => dia.hoy)).toHaveLength(1);
    expect(modelo.dias.every((dia) => dia.episodio && dia.audio && esRetoConCuenta(dia.episodio))).toBe(true);
    const soloUno = modeloDeReto(adviento!, rangos, "es", "2026-11-29", new Set(["is-01"]));
    expect(soloUno.dias[0]?.audio).toBe(true);
    expect(soloUno.dias.slice(1).every((dia) => !dia.audio)).toBe(true);
    const srcs = modelo.dias.map((dia) => dia.src).filter((src): src is string => Boolean(src));
    expect(new Set(srcs).size).toBe(srcs.length);
    expect(modelo.portada).toBeTruthy();
    expect(srcs.includes(modelo.portada!)).toBe(false);
    const antes = modeloDeReto(adviento!, rangos, "es", "2026-11-11");
    expect(antes.dias.every((dia) => !dia.hoy)).toBe(true);
    expect(antes.empezar).toBe("is-01");
  });

  it("el audio de Adviento pide cuenta y gn-01 sigue libre", () => {
    expect(esAudioGratis("gn-01", "gn-01")).toBe(true);
    expect(esAudioGratis("is-01", "gn-01")).toBe(false);
    expect(esRetoConCuenta("is-01")).toBe(true);
    expect(esRetoConCuenta("gn-01")).toBe(false);
    expect(esAudioGratis("is-02", "gn-01,is-02")).toBe(true);
    expect(esRetoConCuenta("is-02")).toBe(true);
  });
});

describe("vuelta tras entrar", () => {
  it("solo acepta una ruta interna y conserva el día", () => {
    expect(rutaDeVuelta("/es/retos/adviento-isaias")).toBe("/es/retos/adviento-isaias");
    expect(rutaDeVuelta("https://otro.example/es")).toBeNull();
    expect(rutaDeVuelta("//otro.example")).toBeNull();
    expect(hrefEntrar("es", "/es/retos/adviento-isaias", "is-03")).toBe("/es/entrar?siguiente=%2Fes%2Fretos%2Fadviento-isaias&aviso=reto&oir=is-03");
    expect(destinoTrasEntrar("/es/retos/adviento-isaias", "is-03")).toBe("/es/retos/adviento-isaias?oir=is-03");
    expect(destinoTrasEntrar(null, "is-03")).toBe("/escuchar");
  });
});
