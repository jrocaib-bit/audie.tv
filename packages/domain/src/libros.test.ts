import { describe, expect, it } from "vitest";
import {
  aplicarSubrayados, afirmativo, capituloParaVista, cortarLibro, hrefEpisodioDesdeLibro, recomendarLibros,
  rangoDeFrase, rutaLibrosSegura, textoDeTrozos, trozosDeHtml, urlAmazonSegura,
  type LibroParaRecomendar, type LibroTexto,
} from "./libros";
import { anotacionesVacias, fusionarAnotaciones, nuevoIdLibros, parseAnotaciones } from "./libros-cliente";
import { destinoTrasEntrar, hrefEntrarParaLibros, rutaRetoSegura, rutaVueltaSegura } from "./retos-cuenta";

const cap = (id: string, orden: number, adelanto: boolean, texto: string) => ({
  id, orden, tipo: orden === 0 ? "prologo" as const : "capitulo" as const, numero: orden || null, titulo: `Título ${id}`, es_adelanto: adelanto,
  bloques: [{ id: `${id}-p-001`, tipo: "parrafo" as const, texto, html: texto, referencias: [] }],
});
const libro: LibroTexto = {
  id: "x", titulo: "X", subtitulo: "x", idioma: "es", libro_biblico: "Génesis", libro_id: "gn", adelanto_hasta_capitulo_id: "prologo",
  capitulos: [cap("prologo", 0, true, "ABIERTO"), cap("c1", 1, false, "SECRETO_UNO"), cap("c2", 2, false, "SECRETO_DOS")],
};

describe("cortarLibro", () => {
  it("sin premium solo lleva el prólogo, y el índice solo títulos", () => {
    const cortado = cortarLibro(libro, false);
    expect(cortado.capitulos.map((c) => c.id)).toEqual(["prologo"]);
    expect(cortado.indice.map((c) => [c.id, c.es_adelanto])).toEqual([["prologo", true], ["c1", false], ["c2", false]]);
    const crudo = JSON.stringify(cortado);
    expect(crudo).toContain("ABIERTO");
    expect(crudo).not.toContain("SECRETO");
    expect(crudo).toContain("Título c2");
  });
  it("premium lleva el libro entero", () => {
    expect(cortarLibro(libro, true).capitulos).toHaveLength(3);
  });
  it("adelanto_hasta_capitulo_id amplía el adelanto", () => {
    const hasta = cortarLibro({ ...libro, adelanto_hasta_capitulo_id: "c1" }, false);
    expect(hasta.capitulos.map((c) => c.id)).toEqual(["prologo", "c1"]);
  });
  it("capituloParaVista: 401, 403 y 200", () => {
    expect(capituloParaVista(libro, "c1", "sin-sesion")).toEqual({ ok: false, motivo: "sin-sesion" });
    expect(capituloParaVista(libro, "c1", "gratuito")).toEqual({ ok: false, motivo: "sin-permiso" });
    expect(capituloParaVista(libro, "c1", "premium").ok).toBe(true);
    expect(capituloParaVista(libro, "prologo", "sin-sesion").ok).toBe(true);
    expect(capituloParaVista(libro, "zz", "premium")).toEqual({ ok: false, motivo: "no-encontrado" });
  });
});

describe("texto de un bloque", () => {
  const html = 'Mira (<a class="ref-biblica" data-ref="Gn 1,1" data-libro="gn" data-episodio="gn-01" href="/es/episodio/gn-01">Gn 1,1</a>) y <em>esto &amp; aquello</em><script>alert(1)</script><img src=x onerror=alert(1)>.';
  it("deja em y enlaces de referencia, y tira el resto", () => {
    const trozos = trozosDeHtml(html);
    expect(trozos.find((t) => t.tipo === "ref")).toMatchObject({ episodio: "gn-01", texto: "Gn 1,1" });
    expect(trozos.find((t) => t.tipo === "texto" && t.em)).toMatchObject({ texto: "esto & aquello" });
    expect(textoDeTrozos(trozos)).not.toContain("<img");
    expect(JSON.stringify(trozos)).not.toContain("onerror");
  });
  it("un enlace que no es ref-biblica o con episodio raro no es enlace", () => {
    expect(trozosDeHtml('<a href="https://evil.test">x</a>').some((t) => t.tipo === "ref")).toBe(false);
    expect(trozosDeHtml('<a class="ref-biblica" data-episodio="../x" href="/es/episodio/gn-01">x</a>').some((t) => t.tipo === "ref")).toBe(false);
    expect(trozosDeHtml('<a class="ref-biblica" data-episodio="javascript:1" href="javascript:alert(1)">x</a>').some((t) => t.tipo === "ref")).toBe(false);
  });
  it("los subrayados parten los trozos por desplazamiento", () => {
    const trozos = trozosDeHtml("Hola <em>mundo</em> entero");
    const pintados = aplicarSubrayados(trozos, [{ id: "s1", inicio: 2, fin: 8 }]);
    expect(pintados.map((p) => [p.tipo === "br" ? "" : p.texto, "subrayados" in p ? p.subrayados : undefined])).toEqual([
      ["Ho", undefined], ["la ", ["s1"]], ["mun", ["s1"]], ["do", undefined], [" entero", undefined],
    ]);
    expect(textoDeTrozos(pintados)).toBe("Hola mundo entero");
  });
});

describe("recomendaciones", () => {
  const ep = (id: string) => ({ episodio_id: id });
  const c = (id: string, volumen: number, libro_id: string, disponibilidad: LibroParaRecomendar["disponibilidad"], cruces: string[] = []): LibroParaRecomendar => ({
    id, titulo: id, subtitulo: "", volumen, libro_id, disponibilidad, episodios_del_libro_comentado: [], episodios_cruzados: cruces.map(ep),
  });
  it("el volumen propio primero, luego cruces, máximo 3, sin borradores", () => {
    const catalogo = [c("a", 1, "jn", "lectura", ["gn-01"]), c("b", 2, "gn", "lectura"), c("d", 3, "mt", "borrador", ["gn-01"]), c("e", 4, "is", "preparandose", ["gn-01"]), c("f", 5, "lc", "lectura", ["gn-01"]), c("g", 6, "ap", "lectura", ["gn-01"])];
    expect(recomendarLibros("gn-01", catalogo).map((r) => [r.id, r.motivo])).toEqual([["b", "propio"], ["a", "cruce"], ["e", "cruce"]]);
    expect(recomendarLibros("gn-01", catalogo, 1)).toHaveLength(1);
    expect(recomendarLibros("rut-01", catalogo)).toEqual([]);
    expect(recomendarLibros("gn-01", [c("d", 3, "gn", "borrador")])).toEqual([]);
  });
});

describe("rutas y flags", () => {
  it("rutaLibrosSegura acepta /lang/libros y subrutas", () => {
    for (const ok of ["/es/libros", "/es/libros/gen-antes", "/es/libros/gen-antes/leer", "/es/libros/gen-antes/leer?c=capitulo-03&b=capitulo-03-p-010"]) expect(rutaLibrosSegura(ok)).toBe(ok);
  });
  it("rechaza open redirect y trucos", () => {
    for (const mal of ["//evil.test", "https://evil.test/es/libros", "/es/libros//x", "/es/libros/../x", "/es/libros/x/y/z", "/es/libros?next=http://x", "/es/libros/x?c=a://b", "/es/libros\\x", "/escuchar", "/reto/x", "es/libros", "/es/libros/x#h", "/es/libros/" + "a".repeat(300), "", null, undefined, 4]) {
      expect(rutaLibrosSegura(mal)).toBeNull();
    }
  });
  it("rutaVueltaSegura admite reto o libros; rutaRetoSegura no cambia", () => {
    expect(rutaVueltaSegura("/reto/adviento-isaias")).toBe("/reto/adviento-isaias");
    expect(rutaVueltaSegura("/es/libros/x/leer")).toBe("/es/libros/x/leer");
    expect(rutaVueltaSegura("/escuchar")).toBeNull();
    expect(rutaRetoSegura("/es/libros/x")).toBeNull();
    expect(destinoTrasEntrar("/es/libros/x/leer?c=prologo")).toBe("/es/libros/x/leer?c=prologo");
    expect(destinoTrasEntrar("//evil.test")).toBe("/escuchar");
    expect(hrefEntrarParaLibros("es", "/es/libros/x/leer")).toBe("/es/entrar?next=%2Fes%2Flibros%2Fx%2Fleer");
    expect(hrefEntrarParaLibros("../x", "https://evil.test")).toBe("/es/entrar");
  });
  it("hrefEpisodioDesdeLibro lleva la vuelta al lector", () => {
    expect(hrefEpisodioDesdeLibro("es", "gn-10", "/es/libros/x/leer?c=prologo")).toBe("/es/episodio/gn-10?desde=%2Fes%2Flibros%2Fx%2Fleer%3Fc%3Dprologo");
    expect(hrefEpisodioDesdeLibro("es", "gn-10", "https://evil.test")).toBe("/es/episodio/gn-10");
  });
  it("flag de Amazon: solo 1 o true", () => {
    expect(["1", "true", "TRUE", " true "].every(afirmativo)).toBe(true);
    expect([undefined, "", "0", "false", "si", "yes", "2"].some(afirmativo)).toBe(false);
  });
  it("urlAmazonSegura solo acepta https de Amazon", () => {
    expect(urlAmazonSegura("https://www.amazon.es/dp/B0X")).toBe("https://www.amazon.es/dp/B0X");
    for (const mal of ["http://www.amazon.es/dp/x", "https://evil.test/amazon.es", "https://amazon.es.evil.test/x", "javascript:alert(1)", "", 3]) expect(urlAmazonSegura(mal)).toBeNull();
  });
});

describe("anotaciones", () => {
  it("fusiona por id y gana el progreso más reciente", () => {
    const a = { ...anotacionesVacias(), progreso: { libro_id: "x", capitulo_id: "a", bloque_id: null, ratio: 0, updated_at: "2026-01-02T00:00:00Z" } };
    const b = { ...anotacionesVacias(), progreso: { libro_id: "x", capitulo_id: "b", bloque_id: null, ratio: 0, updated_at: "2026-01-01T00:00:00Z" } };
    expect(fusionarAnotaciones(a, b).progreso?.capitulo_id).toBe("a");
    expect(fusionarAnotaciones(b, a).progreso?.capitulo_id).toBe("a");
  });
  it("parseAnotaciones descarta lo roto", () => {
    const r = parseAnotaciones({ notas: [{ id: "1", capitulo_id: "c", texto: "ok" }, { id: "2" }], subrayados: [{ id: "s", capitulo_id: "c", bloque_id: "b", inicio: 5, fin: 2 }], progreso: { capitulo_id: "c", ratio: 9 } }, "x");
    expect(r.notas).toHaveLength(1);
    expect(r.subrayados).toHaveLength(0);
    expect(r.progreso?.ratio).toBeNull();
    expect(parseAnotaciones(null, "x")).toEqual(anotacionesVacias());
  });
  it("nuevoIdLibros tiene forma de uuid", () => {
    expect(nuevoIdLibros()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe("rangoDeFrase", () => {
  const t = "Primera frase aquí. Segunda frase, con coma. ¿Tercera?";
  it("devuelve la frase que contiene la posición", () => {
    const r = rangoDeFrase(t, t.indexOf("coma"));
    expect(t.slice(r.inicio, r.fin)).toBe("Segunda frase, con coma.");
    expect(t.slice(rangoDeFrase(t, 2).inicio, rangoDeFrase(t, 2).fin)).toBe("Primera frase aquí.");
    const u = rangoDeFrase(t, t.length - 2);
    expect(t.slice(u.inicio, u.fin)).toBe("¿Tercera?");
  });
  it("un texto sin puntos es una sola frase", () => {
    expect(rangoDeFrase("sin puntos", 3)).toEqual({ inicio: 0, fin: 10 });
  });
});
