import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { episodioConObraLibre, episodioDeCita, finDePascua, inicioDeTemporada, portadasDeTemporada, retosDeTemporada } from "./retos-anio";
import { obraDeEpisodio } from "@audite/content/obras";

describe("retos del año", () => {
  it("sigue el orden y los días del documento, sin texto bíblico", () => {
    const retos = retosDeTemporada();
    expect(retos.map((reto) => reto.id)).toEqual([
      "adviento-isaias",
      "navidad-infancia",
      "cuaresma-40",
      "semana-santa-pasion",
      "pascua-hechos",
      "ordinario-evangelio",
    ]);
    expect(retos.map((reto) => reto.dias.length)).toEqual([26, 17, 40, 8, 50, 16]);
    expect(retos[0]?.dias[0]).toMatchObject({ es: "La montaña", cita: "Is 2,1–5" });
    expect(retos[0]?.dias[2]).toMatchObject({ es: "El Enmanuel", en: "Emmanuel", cita: "Is 7,10–14" });
    expect(retos[0]?.dias[24]).toMatchObject({ es: "Un rey justo", en: "A righteous king", cita: "Is 32,1–4" });
    expect(retos[0]?.dias[25]).toMatchObject({ es: "Mira a tu salvador", en: "See your savior", cita: "Is 62,10–12" });
    const archivo = readFileSync(path.resolve("apps/web/src/lib/retos-anio-datos.ts"), "utf8");
    expect(archivo).not.toContain("Al principio creó");
    expect(archivo).not.toContain("Conferencia Episcopal");
  });

  it("calcula el inicio del ciclo 2026-27 con el calendario", () => {
    expect(inicioDeTemporada("adviento-isaias")).toBe("2026-11-29");
    expect(inicioDeTemporada("navidad-infancia")).toBe("2026-12-25");
    expect(inicioDeTemporada("ordinario-evangelio")).toBe("2027-01-11");
    expect(inicioDeTemporada("cuaresma-40")).toBe("2027-02-10");
    expect(inicioDeTemporada("semana-santa-pasion")).toBe("2027-03-21");
    expect(inicioDeTemporada("pascua-hechos")).toBe("2027-03-28");
    expect(finDePascua()).toBe("2027-05-16");
  });

  it("enlaza el pasaje con el episodio cuyo rango lo contiene", () => {
    const rangos = loadAppCatalog().rangos;
    expect(episodioDeCita("Is 2,1–5", rangos)).toBe("is-01");
    expect(episodioDeCita("Ex 1,8-14", rangos)).toBe("ex-01");
    expect(episodioDeCita("Is 99,1", rangos)).toBeNull();
  });

  it("no repite la obra de portada ni pisa la del catálogo si hay otra", () => {
    const portadas = portadasDeTemporada(loadAppCatalog().rangos);
    const obras = Object.values(portadas).map((portada) => portada?.obraId);
    expect(new Set(obras).size).toBe(obras.length);
    expect(portadas["adviento-isaias"]?.tipo).toBe("reto");
    expect(portadas["navidad-infancia"]?.tipo).toBe("reto");
    expect(portadas["cuaresma-40"]).toMatchObject({ tipo: "episodio" });
    expect(portadas["cuaresma-40"]?.tipo === "episodio" ? portadas["cuaresma-40"].episodio : "").not.toBe("ex-01");
  });

  it("elige el primer episodio cuyo cuadro no está ya en la home", () => {
    const rangos = loadAppCatalog().rangos;
    const genesis = obraDeEpisodio("gn-01")?.id;
    const evitar = new Set(genesis ? [genesis] : []);
    const biblia = episodioConObraLibre(rangos.map((rango) => rango.id), evitar);
    const pasajes = (id: string) => retosDeTemporada().find((reto) => reto.id === id)?.dias.flatMap((dia) => {
      const episodio = episodioDeCita(dia.cita, rangos);
      return episodio ? [episodio] : [];
    }) ?? [];
    const deAdviento = episodioConObraLibre(pasajes("adviento-isaias"), new Set([...evitar, obraDeEpisodio(biblia ?? "")?.id].filter((id): id is string => Boolean(id))));
    const deCuaresma = episodioConObraLibre(pasajes("cuaresma-40"), new Set([...evitar, obraDeEpisodio(biblia ?? "")?.id, obraDeEpisodio(deAdviento ?? "")?.id].filter((id): id is string => Boolean(id))));
    expect(biblia).toBe("gn-02");
    expect(deAdviento).toBe("is-01");
    expect(deCuaresma).toBe("ex-01");
  });
});
