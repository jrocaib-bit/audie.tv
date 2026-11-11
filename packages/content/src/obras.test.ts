import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { obraAvif, obraWebp, rotuloObra } from "./obras-visibles";
import { calcularPortadasProvisionales, creditoDeObraVerificado, identidadesRenderizadas, obraDeEpisodio, obrasVisibles, portadaDeReto, portadaPara, portadasCredito, portadasDeRetos, textoVerificado } from "./obras";
import { episodiosSinObra, esPortadaProvisional } from "./obras-visibles";

describe("obras con crédito", () => {
  it("publica las 516 obras, una por episodio, sin huecos de crédito", () => {
    const obras = obrasVisibles();
    expect(obras).toHaveLength(516);
    expect(new Set(obras.map((obra) => obra.episodio)).size).toBe(516);
    expect(portadasCredito()).toHaveLength(516);
    for (const obra of obras) {
      expect(textoVerificado(obra.titulo.es)).toBe(true);
      expect(textoVerificado(obra.titulo.en)).toBe(true);
      expect(textoVerificado(obra.autor.es)).toBe(true);
      expect(textoVerificado(obra.autor.en)).toBe(true);
      expect(textoVerificado(obra.placa.es)).toBe(true);
      expect(textoVerificado(obra.placa.en)).toBe(true);
      expect(obra.placa.es).not.toMatch(/pendiente/i);
      expect(obra.placa.en).not.toMatch(/pendiente/i);
      expect(obra.licencia).toMatch(/CC0|Public domain|Dominio público/);
      expect(obra.placa.es).toContain(obra.titulo.es);
      expect(obra.placa.es).toContain(obra.autor.es);
      expect(obra.ancho).toBeGreaterThan(0);
      expect(obra.alto).toBeGreaterThan(0);
      if (obra.credito_completo) {
        expect(textoVerificado(obra.fecha)).toBe(true);
        expect(textoVerificado(obra.ubicacion.es)).toBe(true);
      }
    }
    const genesis = obraDeEpisodio("gn-01");
    const corintios = obraDeEpisodio("1cor-01");
    expect(obraWebp(genesis!)).toMatch(/\/gn-01_o5-detalle-960\.webp$/);
    expect(obraWebp(corintios!)).toMatch(/\/1cor-01_o\d+-960\.webp$/);
    expect(obraWebp(corintios!)).toContain(process.env.NEXT_PUBLIC_OBRAS_BASE?.replace(/\/$/, "") || "qdjowihivtqoelurvyke.supabase.co");
    expect(obraAvif(genesis!)).toBeNull();
    expect(rotuloObra(corintios!, "es")).toBe("1 Corintios · Episodio 1");
    expect(rotuloObra(corintios!, "es")).not.toContain("Génesis");
  });

  it("rechaza una obra sin crédito o marcada como pendiente", () => {
    expect(creditoDeObraVerificado({ principal: true, uso: "principal", titulo: { es: "PENDIENTE", en: "Pending" } })).toBe(false);
    expect(creditoDeObraVerificado({ principal: false, uso: "alternativa" })).toBe(false);
    expect(obraDeEpisodio("gn-01")?.id).toBe("gn-01_o5");
    expect(obraDeEpisodio("gn-01")?.detalle).toBe(true);
    expect(obraDeEpisodio("no-existe")).toBeNull();
  });

  it("usa solo la obra principal aprobada de cada reto", () => {
    const portadas = portadasDeRetos();
    expect(portadas.map((portada) => portada.retoId)).toEqual(["adviento-isaias", "navidad-infancia"]);
    expect(portadas.every((portada) => portada.id.endsWith("_o2"))).toBe(true);
    expect(portadaDeReto("cuaresma-40")).toBeNull();
    const adviento = portadaDeReto("adviento-isaias");
    expect(adviento?.titulo.es).toBe("La Anunciación");
    expect(adviento?.autor.es).toBe("Joos van Cleve");
    expect(adviento?.ubicacion.es).toContain("Metropolitan Museum of Art");
    expect(adviento?.licencia).toMatch(/CC0/);
    expect(adviento?.src).toEqual({
      vertical: "/obras/reto-adviento_o2-9x16.webp",
      cuadrado: "/obras/reto-adviento_o2-1x1.webp",
      ancho: "/obras/reto-adviento_o2-16x9.webp",
    });
    const navidad = portadaDeReto("navidad-infancia");
    expect(navidad?.titulo.es).toBe("La adoración de los pastores");
    expect(navidad?.autor.es).toBe("Giorgione");
    expect(navidad?.ubicacion.es).toBe("National Gallery of Art, Washington");
    expect(navidad?.licencia).toMatch(/CC0/);
    expect(navidad?.src.ancho).toBe("/obras/reto-navidad_o2-16x9.webp");
  });

  it("rota la portada de un día a otro sin repetirla en la misma pantalla", () => {
    const hoy = portadaPara("Marcos", [], 190);
    const manana = portadaPara("Marcos", [], 191);
    expect(hoy).toBeTruthy();
    expect(manana).toBeTruthy();
    expect(hoy).not.toBe(manana);
    expect(portadaPara("Marcos", hoy ? [hoy] : [], 190)).not.toBe(hoy);
  });

  it("no comparte la obra principal ni la presta como portada de reto", () => {
    const obras = obrasVisibles();
    const episodios = new Map<string, string[]>();
    for (const obra of obras) {
      const lista = episodios.get(obra.id) ?? [];
      lista.push(obra.episodio);
      episodios.set(obra.id, lista);
    }
    expect([...episodios.values()].filter((lista) => lista.length > 1)).toEqual([]);
    const porFicha = new Map(obras.map((obra) => [obra.fuente_url, obra.episodio]));
    const creditos = JSON.parse(readFileSync(path.resolve(import.meta.dirname, "../../../content/obras/creditos.json"), "utf8")) as {
      retos?: { obras?: { id?: string; principal?: boolean; fuente?: { url_ficha?: string } }[] };
    };
    for (const portada of portadasDeRetos()) {
      const ficha = creditos.retos?.obras?.find((obra) => obra.id === portada.id)?.fuente?.url_ficha ?? "";
      expect(ficha, portada.id).not.toBe("");
      expect(porFicha.has(ficha), portada.id).toBe(false);
    }
    const principales = new Set((creditos.retos?.obras ?? []).filter((obra) => obra.principal === true).map((obra) => obra.id));
    expect(principales.has("reto-adviento_o1")).toBe(true);
    expect(principales.has("reto-navidad_o1")).toBe(true);
  });

  it("no pinta dos veces la misma obra, ni en portadas", () => {
    expect([...episodiosSinObra()]).toEqual([]);
    const calculadas = calcularPortadasProvisionales();
    expect(calculadas).toEqual([]);
    const pintadas = obrasVisibles().map((obra) => obra.episodio).filter((episodio) => esPortadaProvisional(episodio));
    expect(pintadas).toEqual([]);
    expect(esPortadaProvisional("1cr-06")).toBe(false);
    expect(esPortadaProvisional("gn-01")).toBe(false);
    const repetidos = (clave: "sha256" | "inventario" | "tituloAutor") => {
      const vistos = new Map<string, string>();
      const choques: string[] = [];
      for (const obra of identidadesRenderizadas()) {
        const valor = obra[clave];
        if (!valor) continue;
        const previo = vistos.get(valor);
        if (previo) choques.push(`${clave} ${valor}: ${previo} y ${obra.id}`);
        else vistos.set(valor, obra.id);
      }
      return choques;
    };
    expect(repetidos("sha256")).toEqual([]);
    expect(repetidos("inventario")).toEqual([]);
    expect(repetidos("tituloAutor")).toEqual([]);
  });

  it("los títulos de la portada de marca salen del canon, sin leer el disco en el cliente", () => {
    const titulos = JSON.parse(readFileSync(path.resolve(import.meta.dirname, "../../../content/obras/titulos-portada.json"), "utf8")) as Record<string, { es: string; en: string }>;
    expect(Object.keys(titulos).sort()).toEqual([...episodiosSinObra()].sort());
    for (const [id, texto] of Object.entries(titulos)) {
      const libro = id.slice(0, id.lastIndexOf("-"));
      const canon = JSON.parse(readFileSync(path.resolve(import.meta.dirname, `../../../content/canon/libros/${libro}.json`), "utf8")) as { episodios: { id: string; titulo?: { es?: string }; titulo_corto?: { es?: string }; tituloCorto?: { es?: string } }[] };
      const episodio = canon.episodios.find((item) => item.id === id);
      const corto = episodio?.titulo_corto?.es || episodio?.tituloCorto?.es || episodio?.titulo?.es;
      expect(texto.es, id).toBe(corto);
    }
    const componente = readFileSync(path.resolve(import.meta.dirname, "../../../apps/web/src/components/portada-marca.tsx"), "utf8");
    expect(componente).not.toMatch(/app-catalog|node:fs|loadAppCatalog/);
  });

  it("no arrastra el texto bíblico dentro del catálogo visible", () => {
    const texto = readFileSync(path.resolve(import.meta.dirname, "../../../content/obras/visibles.json"), "utf8");
    expect(texto).not.toContain("Al principio creó Dios");
    expect(texto).not.toContain("informe y vacía");
  });
});
