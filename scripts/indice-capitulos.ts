/**
 * Genera content/canon/indice-capitulos.json a partir del manifiesto.
 *
 *   npm run indice:capitulos
 *   npm run indice:capitulos -- /workspace/audite/01_canon/manifiesto.json
 *   AUDITE_MANIFIESTO=/ruta/manifiesto.json npm run indice:capitulos
 *   npm run indice:capitulos -- --comprobar   (falla si el JSON commiteado no coincide)
 *
 * Solo copia metadatos: libro, sección, capítulo, episodio, títulos y, si el manifiesto trae `tiempos`, el segundo de entrada.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Manifiesto } from "../packages/domain/src/manifiesto.ts";
import { generarIndiceCapitulos } from "../packages/content/src/indice-capitulos.ts";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argumentos = process.argv.slice(2);
const comprobar = argumentos.includes("--comprobar");
const entrada = path.resolve(argumentos.find((valor) => !valor.startsWith("--")) ?? process.env.AUDITE_MANIFIESTO ?? path.join(raiz, "content/canon/01_canon/manifiesto.json"));
const salida = path.join(raiz, "content/canon/indice-capitulos.json");

let manifiesto: Manifiesto;
try {
  manifiesto = JSON.parse(readFileSync(entrada, "utf8")) as Manifiesto;
} catch (error) {
  console.error(`No se pudo leer ${entrada}: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
if (!Array.isArray(manifiesto.libros) || typeof manifiesto.actualizado !== "string") {
  console.error(`${entrada} no tiene la forma de un manifiesto (faltan libros o actualizado).`);
  process.exit(1);
}

const texto = generarIndiceCapitulos(manifiesto);
const resumen = (JSON.parse(texto) as { resumen: Record<string, number> }).resumen;

if (comprobar) {
  let actual = "";
  try {
    actual = readFileSync(salida, "utf8");
  } catch {
    actual = "";
  }
  if (actual !== texto) {
    console.error("content/canon/indice-capitulos.json no coincide con el manifiesto. Ejecuta npm run indice:capitulos.");
    process.exit(1);
  }
  console.log("Índice al día.", resumen);
} else {
  writeFileSync(salida, texto);
  console.log(`Escrito ${path.relative(raiz, salida)} desde ${entrada}`, resumen);
}
