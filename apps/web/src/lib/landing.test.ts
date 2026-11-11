import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { audioListo } from "@audite/content/audio-listo";
import { obraDeEpisodio } from "@audite/content/obras";
import { idsDePrueba } from "./retos-anio";
import { rutaDeInicio } from "@/sitio/i18n";

describe("salida y landing", () => {
  it("el logo del reproductor vuelve a la home del idioma", () => {
    expect(rutaDeInicio("es")).toBe("/es");
    expect(rutaDeInicio("en")).toBe("/en");
    expect(rutaDeInicio("it")).toBe("/it");
    expect(rutaDeInicio("xx")).toBe("/es");
  });

  it("la prueba son gn-01 y los episodios de Isaías que ya están listos", () => {
    const listos = new Set(audioListo().episodios.map((episodio) => episodio.id));
    const ids = idsDePrueba(loadAppCatalog().rangos, listos);
    expect(ids[0]).toBe("gn-01");
    expect(ids.filter((id) => id.startsWith("is-")).length).toBeGreaterThan(5);
    expect(ids.every((id) => listos.has(id))).toBe(true);
  });

  it("el diccionario de la home está en español y en inglés", () => {
    const es = JSON.parse(readFileSync("content/sitio/es.json", "utf8")) as Record<string, string>;
    const en = JSON.parse(readFileSync("content/sitio/en.json", "utf8")) as Record<string, string>;
    for (const clave of ["listenFree", "homeWhat", "tryTitle", "priceSave", "faqWhatQ", "storeSoon", "howTitle", "stepChoose", "priceFree", "badgeGet", "phoneHello"]) {
      expect(es[clave]?.length).toBeGreaterThan(0);
      expect(en[clave]?.length).toBeGreaterThan(0);
      expect(es[clave]).not.toBe(en[clave]);
    }
    expect(es.exitSite).toBe("audite.tv");
    expect(es.listenFree).toBe("Escucha gratis");
    expect(es.homeCta).toBe("Empieza 7 días gratis");
    expect(es.ctaAdvent).toBe("Empieza el reto");
    expect(es.statMinutes).toBe("min al día");
    expect(es.statYear).toBe("retos del año");
    expect(JSON.stringify(es)).not.toContain("7 idiomas");
  });

  it("cada episodio de la prueba tiene obra", () => {
    const listos = new Set(audioListo().episodios.map((episodio) => episodio.id));
    const ids = idsDePrueba(loadAppCatalog().rangos, listos);
    expect(ids).toEqual(expect.arrayContaining(["gn-01", "is-02", "is-03"]));
    for (const id of ids) expect(obraDeEpisodio(id)?.id, id).toBeTruthy();
  });
});
