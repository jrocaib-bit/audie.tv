import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { obraAvif, obraWebp, rotuloObra } from "./obras-visibles";
import { creditoDeObraVerificado, obraDeEpisodio, obrasVisibles, portadaDeReto, portadaPara, portadasCredito, portadasDeRetos, textoVerificado } from "./obras";

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
    expect(portadas.every((portada) => portada.id.endsWith("_o1"))).toBe(true);
    expect(portadaDeReto("cuaresma-40")).toBeNull();
    const adviento = portadaDeReto("adviento-isaias");
    expect(adviento?.titulo.es).toBe("El reino pacífico");
    expect(adviento?.autor.es).toBe("Edward Hicks");
    expect(adviento?.licencia).toMatch(/CC0/);
    expect(adviento?.src).toEqual({
      vertical: "/obras/reto-adviento_o1-9x16.webp",
      cuadrado: "/obras/reto-adviento_o1-1x1.webp",
      ancho: "/obras/reto-adviento_o1-16x9.webp",
    });
    expect(portadaDeReto("navidad-infancia")?.titulo.es).toBe("Madonna adorando al Niño");
  });

  it("rota la portada de un día a otro sin repetirla en la misma pantalla", () => {
    const hoy = portadaPara("Marcos", [], 190);
    const manana = portadaPara("Marcos", [], 191);
    expect(hoy).toBeTruthy();
    expect(manana).toBeTruthy();
    expect(hoy).not.toBe(manana);
    expect(portadaPara("Marcos", hoy ? [hoy] : [], 190)).not.toBe(hoy);
  });

  it("no arrastra el texto bíblico dentro del catálogo visible", () => {
    const texto = readFileSync(path.resolve(import.meta.dirname, "../../../content/obras/visibles.json"), "utf8");
    expect(texto).not.toContain("Al principio creó Dios");
    expect(texto).not.toContain("informe y vacía");
  });
});
