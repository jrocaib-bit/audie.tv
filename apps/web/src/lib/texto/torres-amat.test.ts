/**
 * Datos de Torres Amat versionados en content/texto/torres-amat. Comprueba el esquema, la coherencia de los
 * tiempos y que la cobertura publicada coincide con los ficheros.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { estaSincronizado, FUENTE_TORRES_AMAT } from "@audite/domain";
import { fuenteTexto, leerTexto, origenTexto, rutaContenidoTexto, vaciarCacheTexto } from "./almacen";
import { validarTexto } from "./esquema";

const raiz = path.resolve(__dirname, "../../../../../content/texto/torres-amat");
const carpeta = path.join(raiz, "es");
const ficheros = readdirSync(carpeta).filter((f) => f.endsWith(".json")).sort();
const cobertura = JSON.parse(readFileSync(path.join(raiz, "cobertura.json"), "utf8")) as {
  total: number;
  texto_resaltado: number;
  texto: number;
  sin_texto: number;
  episodios: Record<string, { estado: string; versiculos: number | null; motivo?: string }>;
};

describe("texto de Torres Amat versionado", () => {
  it("cada fichero pasa el esquema, es de su episodio y declara la fuente", () => {
    expect(ficheros.length).toBeGreaterThan(300);
    for (const f of ficheros) {
      const id = f.replace(/\.json$/, "");
      const texto = validarTexto(JSON.parse(readFileSync(path.join(carpeta, f), "utf8")), id, "es");
      expect(texto, f).not.toBeNull();
      expect(texto?.fuente, f).toBe(FUENTE_TORRES_AMAT);
      expect(texto?.muestra, f).toBe(false);
      expect(texto?.credito, f).toBe("Texto: Torres Amat (dominio público). Puede no coincidir palabra por palabra con el audio");
    }
  });

  it("sin marcas «(TEXTO OMITIDO)», sin versículos repetidos y con tiempos crecientes y completos", () => {
    for (const f of ficheros) {
      const texto = validarTexto(JSON.parse(readFileSync(path.join(carpeta, f), "utf8")), f.replace(/\.json$/, ""), "es");
      const refs = new Set<string>();
      let anterior = -1;
      const conTiempo = texto!.versiculos.filter((v) => v.t != null).length;
      expect([0, texto!.versiculos.length], `${f}: o todos los versículos llevan t o ninguno`).toContain(conTiempo);
      for (const v of texto!.versiculos) {
        expect(v.texto, f).not.toMatch(/\(\s*TEXTO OMITIDO\s*\)/i);
        expect(refs.has(v.ref), `${f} ${v.ref} repetido`).toBe(false);
        refs.add(v.ref);
        if (v.t != null) {
          expect(v.t, `${f} ${v.ref}`).toBeGreaterThanOrEqual(anterior);
          anterior = v.t;
        }
      }
      if (conTiempo) expect(estaSincronizado(texto!.versiculos)).toBe(true);
    }
  });

  it("cobertura.json coincide con los ficheros", () => {
    const con = Object.entries(cobertura.episodios).filter(([, e]) => e.estado !== "sin_texto").map(([id]) => `${id}.json`).sort();
    expect(con).toEqual(ficheros);
    expect(cobertura.total).toBe(Object.keys(cobertura.episodios).length);
    expect(cobertura.texto_resaltado + cobertura.texto + cobertura.sin_texto).toBe(cobertura.total);
    for (const [id, e] of Object.entries(cobertura.episodios)) {
      if (e.estado === "sin_texto") expect(e.motivo, id).toBeTruthy();
      else {
        const texto = JSON.parse(readFileSync(path.join(carpeta, `${id}.json`), "utf8")) as { versiculos: { t?: number }[] };
        expect(texto.versiculos.length, id).toBe(e.versiculos);
        expect(texto.versiculos.every((v) => v.t != null), id).toBe(e.estado === "texto_resaltado");
      }
    }
  });
});

describe("fuente configurable del texto", () => {
  const previo = { fuente: process.env.TEXTO_FUENTE, ruta: process.env.AUDITE_TEXTO_RUTA };
  afterEach(() => {
    if (previo.fuente === undefined) delete process.env.TEXTO_FUENTE;
    else process.env.TEXTO_FUENTE = previo.fuente;
    if (previo.ruta === undefined) delete process.env.AUDITE_TEXTO_RUTA;
    else process.env.AUDITE_TEXTO_RUTA = previo.ruta;
    vaciarCacheTexto();
  });

  it("por defecto es torres-amat y lee el contenido versionado", async () => {
    delete process.env.TEXTO_FUENTE;
    delete process.env.AUDITE_TEXTO_RUTA;
    expect(fuenteTexto()).toBe("torres-amat");
    expect(rutaContenidoTexto()).not.toBeNull();
    expect(origenTexto()).toBe("torres-amat");
    const id = ficheros[0]!.replace(/\.json$/, "");
    const lectura = await leerTexto("es", id);
    expect(lectura.estado).toBe("ok");
    expect((await leerTexto("es", "cant-01")).estado).toBe("sin-texto");
  });

  it("TEXTO_FUENTE=ninguna no lee nada del repositorio", async () => {
    delete process.env.AUDITE_TEXTO_RUTA;
    process.env.TEXTO_FUENTE = "ninguna";
    expect(origenTexto()).toBe("ninguno");
    expect((await leerTexto("es", ficheros[0]!.replace(/\.json$/, ""))).estado).toBe("sin-texto");
  });

  it("no sirve nada en inglés ni ids con recorrido de rutas", async () => {
    delete process.env.TEXTO_FUENTE;
    delete process.env.AUDITE_TEXTO_RUTA;
    expect((await leerTexto("en", ficheros[0]!.replace(/\.json$/, ""))).estado).toBe("sin-texto");
    expect((await leerTexto("es", "../cobertura")).estado).toBe("sin-texto");
  });
});
