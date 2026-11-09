import { readFileSync } from "node:fs";
import { Ajv, type ErrorObject } from "ajv";
import schema from "../schema/manifiesto.schema.json";
import { idEpisodioValido, idiomaReproducible, rutaSegura, type Manifiesto } from "@audite/domain";

export type ErrorManifiesto = {
  ruta: string;
  codigo: string;
  mensaje: string;
};

const ajv = new Ajv({ allErrors: true, strict: false });
const validar = ajv.compile(schema);

function formato(error: ErrorObject): ErrorManifiesto {
  const ruta = error.instancePath.replaceAll("/", ".").replace(/^\./, "") || "(raíz)";
  return {
    ruta,
    codigo: error.keyword,
    mensaje: `${ruta}: ${error.message ?? "dato no válido"}`,
  };
}

export function validarManifiesto(dato: unknown): { ok: true; manifiesto: Manifiesto } | { ok: false; errores: ErrorManifiesto[] } {
  if (!validar(dato)) {
    return { ok: false, errores: (validar.errors ?? []).map(formato) };
  }
  const manifiesto = dato as Manifiesto;
  const errores: ErrorManifiesto[] = [];
  manifiesto.libros.forEach((libro, libroIndex) => {
    libro.episodios.forEach((episodio, episodioIndex) => {
      if (!idEpisodioValido(libro.id, episodio.id)) {
        const ruta = `libros[${libroIndex}].episodios[${episodioIndex}].id`;
        const esperado = libro.id === "sal" ? "sal-001 … sal-150" : `${libro.id}-01`;
        errores.push({ ruta, codigo: "id", mensaje: `${ruta} debe seguir ${esperado}.` });
      }
      for (const [codigo, idioma] of Object.entries(episodio.idiomas)) {
        const base = `libros[${libroIndex}].episodios[${episodioIndex}].idiomas.${codigo}`;
        if (idioma.master && !rutaSegura(idioma.master)) {
          errores.push({ ruta: `${base}.master`, codigo: "ruta", mensaje: `${base}.master sale de la carpeta de contenido.` });
        }
        if (idioma.subtitulos && !rutaSegura(idioma.subtitulos)) {
          errores.push({ ruta: `${base}.subtitulos`, codigo: "ruta", mensaje: `${base}.subtitulos sale de la carpeta de contenido.` });
        }
      }
      episodio.arte?.forEach((arte, arteIndex) => {
        if (arte.archivo && !rutaSegura(arte.archivo)) {
          errores.push({
            ruta: `libros[${libroIndex}].episodios[${episodioIndex}].arte[${arteIndex}].archivo`,
            codigo: "ruta",
            mensaje: "La ruta de la obra sale de la carpeta de contenido.",
          });
        }
      });
    });
  });
  if (errores.length > 0) return { ok: false, errores };
  return { ok: true, manifiesto };
}

export function leerManifiesto(archivo: string): { ok: true; manifiesto: Manifiesto } | { ok: false; errores: ErrorManifiesto[] } {
  let dato: unknown;
  try {
    dato = JSON.parse(readFileSync(archivo, "utf8")) as unknown;
  } catch (error) {
    return {
      ok: false,
      errores: [{ ruta: archivo, codigo: "lectura", mensaje: error instanceof Error ? error.message : "No se pudo leer el manifiesto." }],
    };
  }
  return validarManifiesto(dato);
}

export function archivosReferenciados(manifiesto: Manifiesto): string[] {
  const rutas = new Set<string>();
  for (const libro of manifiesto.libros) {
    for (const episodio of libro.episodios) {
      for (const idioma of Object.values(episodio.idiomas)) {
        if (idioma.master && rutaSegura(idioma.master)) rutas.add(idioma.master);
        if (idioma.subtitulos && rutaSegura(idioma.subtitulos)) rutas.add(idioma.subtitulos);
      }
      for (const arte of episodio.arte ?? []) {
        if (arte.archivo && rutaSegura(arte.archivo)) rutas.add(arte.archivo);
      }
    }
  }
  return [...rutas];
}

export function informeDisponibilidad(manifiesto: Manifiesto, existe: (ruta: string) => boolean): { faltan: string[]; reproducibles: string[] } {
  const faltan: string[] = [];
  const reproducibles: string[] = [];
  for (const libro of manifiesto.libros) {
    for (const episodio of libro.episodios) {
      for (const [codigo, idioma] of Object.entries(episodio.idiomas)) {
        const masterOk = idioma.master ? existe(idioma.master) : false;
        if (idioma.master && rutaSegura(idioma.master) && !masterOk) faltan.push(idioma.master);
        if (idioma.subtitulos && rutaSegura(idioma.subtitulos) && !existe(idioma.subtitulos)) faltan.push(idioma.subtitulos);
        if (idiomaReproducible(idioma, masterOk)) reproducibles.push(`${episodio.id}:${codigo}`);
      }
      for (const arte of episodio.arte ?? []) {
        if (arte.archivo && rutaSegura(arte.archivo) && !existe(arte.archivo)) faltan.push(arte.archivo);
      }
    }
  }
  return { faltan: [...new Set(faltan)], reproducibles };
}
