import { describe, expect, it } from "vitest";
import { botonesFicha as botonesDominio, etiquetaLomo, type Disponibilidad, type VistaLector } from "@audite/domain";
import { botonesFicha as botonesWeb } from "../../../web/src/lib/libros/botones-ficha";
import { cargarEstanteriaApp, leerVolumenes, urlCubierta, urlLomo } from "./estanteria-datos";

const bruto = (volumen: number, extra: Record<string, unknown> = {}) => ({
  volumen, id: `libro-${volumen}`, libro: "Libro", titulo: `Título ${volumen}`, subtitulo: "S", rotulo: "R", color: "#805F36", sinopsis: "Una frase; otra frase.",
  credito_obra: "Obra, 1500–1510", borrador: false, episodios_total: 3, disponibilidad: "lectura",
  episodios_destacados: [{ episodio_id: "ep-1", etiqueta: "Libro 1–2", titulo: "Uno" }], ...extra,
});

describe("estantería en la app", () => {
  it("construye las URL de lomo y cubierta con la base de la web", () => {
    expect(urlLomo("http://127.0.0.1:43123/", 3)).toBe("http://127.0.0.1:43123/api/libros/portada/lomo-03.webp");
    expect(urlCubierta("http://x.test", 12)).toBe("http://x.test/api/libros/portada/cubierta-12-480.webp");
  });

  it("lee los volúmenes en orden, limpia rayas y descarta lo que no encaja", () => {
    const lista = leerVolumenes({ volumenes: [bruto(2), bruto(1), bruto(99), { basura: true }, bruto(3, { disponibilidad: "otra" }), null] });
    expect(lista.map((v) => v.volumen)).toEqual([1, 2]);
    expect(lista[0]?.episodios_destacados[0]?.etiqueta).toBe("Libro 1 a 2");
    expect(lista[0]?.sinopsis).not.toMatch(/[;–—]/);
    expect(lista[0]?.credito_obra).toBe("Obra, 1500 a 1510");
    expect(leerVolumenes(null)).toEqual([]);
    expect(leerVolumenes({ volumenes: "x" })).toEqual([]);
  });

  it("el lomo lleva la misma etiqueta accesible que en la web", () => {
    const v = leerVolumenes({ volumenes: [bruto(3, { titulo: "Hacia las cuatro de la tarde", libro: "Juan" })] })[0]!;
    expect(etiquetaLomo(v)).toBe("Volumen 3, Hacia las cuatro de la tarde, Juan. Abrir ficha");
  });

  it("si la red falla, no es ok o no hay datos, devuelve null y se conserva la lista", async () => {
    expect(await cargarEstanteriaApp("http://x.test", (async () => { throw new Error("sin red"); }) as typeof fetch)).toBeNull();
    expect(await cargarEstanteriaApp("http://x.test", (async () => new Response("{}", { status: 404 })) as typeof fetch)).toBeNull();
    expect(await cargarEstanteriaApp("http://x.test", (async () => new Response(JSON.stringify({ volumenes: [] }))) as typeof fetch)).toBeNull();
    const pedidas: string[] = [];
    const ok = await cargarEstanteriaApp("http://x.test/", (async (url: string) => { pedidas.push(url); return new Response(JSON.stringify({ volumenes: [bruto(1)] })); }) as unknown as typeof fetch);
    expect(pedidas).toEqual(["http://x.test/api/libros/estanteria"]);
    expect(ok?.map((v) => v.id)).toEqual(["libro-1"]);
  });

  it("los botones de la app y de la web salen iguales para todos los estados", () => {
    const vistas: (VistaLector | null)[] = [null, "sin-sesion", "gratuito", "premium"];
    const disponibilidades: Disponibilidad[] = ["lectura", "preparandose", "borrador"];
    for (const vista of vistas) for (const disp of disponibilidades) for (const progreso of [false, true]) {
      expect(botonesDominio(vista, disp, { progreso })).toEqual(botonesWeb(vista, disp, { progreso }));
    }
  });
});
