import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { creditoTexto, creditoVisible, idEpisodioValido, idiomaReproducible, idsEnOrden, nombreCorto, nombreEpisodio } from "@audite/domain";
import { construirCatalogo } from "./app-catalog";
import { informeDisponibilidad, validarManifiesto } from "./manifiesto";

const canon = path.resolve(import.meta.dirname, "../../../content/canon");
const demo = path.resolve(import.meta.dirname, "../../../content/demo");

function base(episodios: unknown[]) {
  return {
    version: 1,
    actualizado: "2026-11-09",
    idiomas: ["es"],
    libros: [{ id: "gn", orden: 1, testamento: "AT", titulo: { es: "Génesis", en: "Genesis" }, episodios }],
  };
}

describe("validador del manifiesto", () => {
  it("rechaza un estado desconocido, un audio listo sin máster y un bloqueado sin nota", () => {
    const estado = validarManifiesto(base([{ id: "gn-01", orden: 1, idiomas: { es: { estado: "publicado" } } }]));
    expect(estado.ok).toBe(false);
    if (!estado.ok) expect(estado.errores.some((error) => error.mensaje.length > 0)).toBe(true);

    expect(validarManifiesto(base([{ id: "gn-01", orden: 1, idiomas: { es: { estado: "audio_listo" } } }])).ok).toBe(false);
    expect(validarManifiesto(base([{ id: "gn-09", orden: 9, idiomas: { es: { estado: "bloqueado" } } }])).ok).toBe(false);
    expect(validarManifiesto(base([{ id: "gn-04", orden: 4, idiomas: { es: { estado: "borrador" } } }])).ok).toBe(true);
  });

  it("acepta los campos v2 y un hueco en la numeración", () => {
    const salmos = validarManifiesto({
      version: 1,
      actualizado: "2026-11-09",
      idiomas: ["es", "en"],
      libros: [
        {
          id: "sal",
          orden: 23,
          testamento: "AT",
          deuterocanonico: false,
          capitulos_total: 150,
          titulo: { es: "Salmos", en: "Psalms" },
          episodios: [
            { id: "sal-008", orden: 8, propuesta: true, etiqueta: { es: "Salmo 8" }, duracion_estimada_s: 80, idiomas: { es: { estado: "pendiente" } } },
            { id: "sal-009", orden: 9, propuesta: true, etiqueta: { es: "Salmo 9" }, idiomas: { es: { estado: "pendiente" } } },
            { id: "sal-011", orden: 11, propuesta: true, etiqueta: { es: "Salmo 11" }, idiomas: { es: { estado: "pendiente" } } },
          ],
        },
      ],
    });
    expect(salmos.ok).toBe(true);
    if (!salmos.ok) return;
    const ids = idsEnOrden(salmos.manifiesto.libros[0]?.episodios ?? []);
    expect(ids).toEqual(["sal-008", "sal-009", "sal-011"]);
    expect(ids).not.toContain("sal-010");
    expect(validarManifiesto({
      version: 1,
      actualizado: "2026-11-09",
      idiomas: ["es"],
      libros: [{ id: "sal", orden: 1, testamento: "AT", episodios: [{ id: "sal-10", orden: 10, idiomas: { es: { estado: "pendiente" } } }] }],
    }).ok).toBe(false);
    expect(idEpisodioValido("sal", "sal-000")).toBe(false);
    expect(idEpisodioValido("sal", "sal-023")).toBe(true);
    expect(idEpisodioValido("gn", "gn-1")).toBe(false);
  });

  it("acepta titulo_corto y fuente_texto, y deja pendiente el idioma sin crédito", () => {
    const dato = base([
      {
        id: "gn-01",
        orden: 1,
        titulo: { es: "En el principio: la creación y el hombre", en: "In the Beginning" },
        titulo_corto: { es: "La creación" },
        etiqueta: { es: "Génesis 1–2", en: "Genesis 1–2" },
        idiomas: { es: { estado: "listo_voz" } },
      },
    ]);
    const conCredito = validarManifiesto({ ...dato, fuente_texto: { es: "Texto de ejemplo" } });
    expect(conCredito.ok).toBe(true);
    if (!conCredito.ok) return;
    const catalogo = construirCatalogo(conCredito.manifiesto, canon);
    const episodio = catalogo.pendientes[0];
    expect(nombreCorto(episodio ?? { id: "x" }, "es")).toBe("La creación");
    expect(nombreCorto({ id: "gn-01", titulo: { es: "En el principio" }, etiqueta: { es: "Génesis 1–2" } }, "es")).toBe("En el principio");
    expect(nombreCorto({ id: "gn-01", etiqueta: { es: "Génesis 1–2" } }, "es")).toBe("Génesis 1–2");
    expect(catalogo.fuenteTexto).toEqual({ es: "Texto de ejemplo", en: null });
    expect(creditoVisible("Texto bíblico: Sagrada Biblia.", "El texto", "En preparación")).toBe("Texto bíblico: Sagrada Biblia.");
    expect(creditoVisible("Text of the Bible: example", "Text", "In preparation")).toBe("Text of the Bible: example");
    expect(creditoVisible("Sagrada Biblia", "El texto", "En preparación")).toBe("El texto: Sagrada Biblia");
    expect(creditoVisible(null, "Text", "In preparation")).toBe("In preparation");
    expect(creditoTexto(undefined, "es")).toBeNull();
    expect(validarManifiesto({ ...dato, fuente_texto: "un nombre" }).ok).toBe(false);
  });
});

describe("reproducible o pendiente", () => {
  it("solo oye audio_listo con máster presente y duración", () => {
    expect(idiomaReproducible({ estado: "audio_listo", master: "05_audio/a.mp3", duracion_s: 10 }, true)).toBe(true);
    expect(idiomaReproducible({ estado: "audio_listo", master: "05_audio/a.mp3", duracion_s: 10 }, false)).toBe(false);
    expect(idiomaReproducible({ estado: "audio_listo", master: "../secreto.mp3", duracion_s: 10 }, true)).toBe(false);
    expect(idiomaReproducible({ estado: "borrador" }, false)).toBe(false);
    expect(idiomaReproducible({ estado: "listo_voz", master: "05_audio/a.mp3", duracion_s: 10 }, true)).toBe(false);
    expect(idiomaReproducible({ estado: "bloqueado", nota: "interna" }, true)).toBe(false);
  });

  it("no muestra la duración estimada como duración real ni la nota interna", () => {
    const catalogo = construirCatalogo(
      {
        version: 1,
        actualizado: "2026-11-09",
        idiomas: ["es"],
        libros: [
          {
            id: "gn",
            orden: 1,
            testamento: "AT",
            titulo: { es: "Génesis", en: "Genesis" },
            episodios: [
              {
                id: "gn-02",
                orden: 2,
                propuesta: false,
                duracion_estimada_s: 696,
                etiqueta: { es: "Génesis 3–5", en: "Genesis 3–5" },
                idiomas: { es: { estado: "bloqueado", nota: "nota interna que no se publica" } },
              },
              {
                id: "ex-01",
                orden: 1,
                propuesta: true,
                duracion_estimada_s: 400,
                etiqueta: { es: "Éxodo 1–4" },
                idiomas: { es: { estado: "pendiente" } },
              },
            ],
          },
        ],
      },
      canon,
    );
    expect(catalogo.episodes).toEqual([]);
    const bloqueado = catalogo.pendientes.find((episodio) => episodio.id === "gn-02");
    const propuesto = catalogo.pendientes.find((episodio) => episodio.id === "ex-01");
    expect(bloqueado?.presentacion).toBe("revision");
    expect(propuesto?.propuesta).toBe(true);
    expect(propuesto?.presentacion).toBe("preparacion");
    expect(nombreEpisodio(propuesto ?? { id: "x" }, "es")).toBe("Éxodo 1–4");
    const publicado = JSON.stringify(catalogo);
    expect(publicado).not.toContain("nota interna");
    expect(publicado).not.toContain("duracion_estimada_s");
    expect(publicado).not.toContain("696");
  });

  it("el manifiesto real no tiene audio listo y no inventa sal-010", () => {
    const manifiesto = JSON.parse(readFileSync(path.join(canon, "01_canon/manifiesto.json"), "utf8"));
    const validado = validarManifiesto(manifiesto);
    expect(validado.ok).toBe(true);
    const catalogo = construirCatalogo(manifiesto, canon);
    expect(catalogo.books).toHaveLength(73);
    expect(catalogo.episodes).toEqual([]);
    expect(catalogo.pendientes).toHaveLength(516);
    expect(catalogo.rangos).toHaveLength(516);
    expect(catalogo.pendientes.filter((episodio) => episodio.bookId === "gn")).toHaveLength(22);
    expect(catalogo.pendientes.filter((episodio) => episodio.bookId === "job")).toHaveLength(11);
    expect(catalogo.pendientes.filter((episodio) => episodio.bookId === "jer")).toHaveLength(25);
    expect(catalogo.pendientes.filter((episodio) => episodio.bookId === "dn")).toHaveLength(9);
    expect(catalogo.pendientes.filter((episodio) => episodio.propuesta)).toHaveLength(0);
    const salmos = catalogo.pendientes.filter((episodio) => episodio.bookId === "sal").map((episodio) => episodio.id);
    expect(salmos).toHaveLength(24);
    expect(salmos[0]).toBe("sal-001");
    expect(salmos.at(-1)).toBe("sal-024");
    expect(new Set(salmos).size).toBe(salmos.length);
    expect(catalogo.pendientes.find((episodio) => episodio.id === "gn-01")?.presentacion).toBe("preparacion");
    expect(catalogo.fuenteTexto.es).toBe(manifiesto.fuente_texto.es);
    expect(catalogo.fuenteTexto.en).toBeNull();
    const publicado = JSON.stringify(catalogo);
    expect(publicado).not.toContain("Mahalalel");
    expect(publicado).not.toContain("CEE");
    expect(informeDisponibilidad(manifiesto, () => false).reproducibles).toEqual([]);
    const interfaz = readFileSync(path.resolve(import.meta.dirname, "../../domain/src/messages.ts"), "utf8");
    const sitio = readFileSync(path.resolve(import.meta.dirname, "../../../content/sitio/es.json"), "utf8");
    expect(interfaz + sitio).not.toContain("Biblia de Navarra");
    expect(interfaz + sitio).not.toContain("CEE");
  });

  it("la demo queda fuera del canon y no es reproducible sin el máster", () => {
    const manifiesto = JSON.parse(readFileSync(path.join(demo, "01_canon/manifiesto.json"), "utf8"));
    const catalogo = construirCatalogo(manifiesto, demo, "/demo");
    expect(catalogo.episodes).toEqual([]);
    expect(manifiesto.libros[0]?.episodios[0]?.idiomas?.es?.estado).toBe("audio_listo");
    expect(existsSync(path.join(demo, "05_audio/masters/gn-01_es_master_v1.mp3"))).toBe(false);
    expect(existsSync(path.join(demo, "02_guiones/gn-01_es_guion_v1.vtt"))).toBe(false);
    expect(existsSync(path.join(canon, "05_audio/masters/gn-01_es_master_v1.mp3"))).toBe(false);
  });
});
