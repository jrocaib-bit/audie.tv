import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Manifiesto } from "@audite/domain";
import { construirCatalogo, volcarCatalogo } from "./app-catalog";
import { archivosReferenciados, informeDisponibilidad, leerManifiesto, type ErrorManifiesto } from "./manifiesto";

export type InformeSync = {
  ok: boolean;
  origen: string;
  copiados: string[];
  faltan: string[];
  reproducibles: string[];
  errores: ErrorManifiesto[];
};

function esArchivo(entrada: string): boolean {
  return /\.(tar\.gz|tgz|zip)$/i.test(entrada);
}

function extraer(archivo: string, destino: string): string | null {
  mkdirSync(destino, { recursive: true });
  const comando = archivo.toLowerCase().endsWith(".zip")
    ? spawnSync("unzip", ["-q", archivo, "-d", destino], { encoding: "utf8" })
    : spawnSync("tar", ["-xzf", archivo, "-C", destino], { encoding: "utf8" });
  if (comando.status !== 0) return comando.stderr || comando.stdout || "No se pudo abrir el archivo.";
  return null;
}

export function raizDelArbol(dir: string): string | null {
  if (existsSync(path.join(dir, "01_canon/manifiesto.json"))) return dir;
  let nombres: string[] = [];
  try {
    nombres = readdirSync(dir);
  } catch {
    return null;
  }
  for (const nombre of nombres) {
    const anidada = path.join(dir, nombre);
    if (statSync(anidada).isDirectory() && existsSync(path.join(anidada, "01_canon/manifiesto.json"))) return anidada;
  }
  return null;
}

export function sincronizar(entrada: string, destino: string): InformeSync {
  const vacio = { copiados: [] as string[], faltan: [] as string[], reproducibles: [] as string[] };
  if (!existsSync(entrada)) {
    return { ok: false, origen: entrada, ...vacio, errores: [{ ruta: entrada, codigo: "lectura", mensaje: `No está el contenido: ${entrada}` }] };
  }
  let temporal: string | null = null;
  let origen = entrada;
  if (esArchivo(entrada)) {
    temporal = path.join(os.tmpdir(), `audite-sync-${Date.now()}`);
    const fallo = extraer(entrada, temporal);
    if (fallo) {
      rmSync(temporal, { recursive: true, force: true });
      return { ok: false, origen: entrada, ...vacio, errores: [{ ruta: entrada, codigo: "archivo", mensaje: fallo.trim() }] };
    }
    const raiz = raizDelArbol(temporal);
    if (!raiz) {
      rmSync(temporal, { recursive: true, force: true });
      return {
        ok: false,
        origen: entrada,
        ...vacio,
        errores: [{ ruta: entrada, codigo: "archivo", mensaje: "El archivo no contiene 01_canon/manifiesto.json." }],
      };
    }
    origen = raiz;
  } else if (!statSync(entrada).isDirectory()) {
    return { ok: false, origen: entrada, ...vacio, errores: [{ ruta: entrada, codigo: "lectura", mensaje: "La entrada no es una carpeta ni un archivo tar.gz o zip." }] };
  }

  const manifiestoPath = path.join(origen, "01_canon/manifiesto.json");
  const leido = leerManifiesto(manifiestoPath);
  if (!leido.ok) {
    if (temporal) rmSync(temporal, { recursive: true, force: true });
    return { ok: false, origen, ...vacio, errores: leido.errores };
  }

  mkdirSync(path.join(destino, "01_canon"), { recursive: true });
  cpSync(manifiestoPath, path.join(destino, "01_canon/manifiesto.json"));
  const copiados = ["01_canon/manifiesto.json"];
  const faltan: string[] = [];
  for (const relativa of archivosReferenciados(leido.manifiesto)) {
    const desde = path.join(origen, relativa);
    if (!existsSync(desde) || !statSync(desde).isFile()) {
      faltan.push(relativa);
      continue;
    }
    mkdirSync(path.dirname(path.join(destino, relativa)), { recursive: true });
    cpSync(desde, path.join(destino, relativa));
    copiados.push(relativa);
  }

  const disponibles = { wordmark: null as string | null, mark: null as string | null };
  const logoDir = path.join(origen, "03_identidad/logos");
  if (existsSync(logoDir)) {
    for (const nombre of ["wordmark.svg", "wordmark.png", "mark.svg", "mark.png"]) {
      const desde = path.join(logoDir, nombre);
      if (!existsSync(desde)) continue;
      const haciaRel = path.posix.join("03_identidad/logos", nombre);
      mkdirSync(path.dirname(path.join(destino, haciaRel)), { recursive: true });
      cpSync(desde, path.join(destino, haciaRel));
      if (nombre.startsWith("wordmark") && !disponibles.wordmark) disponibles.wordmark = `/canon/${haciaRel}`;
      if (nombre.startsWith("mark") && !disponibles.mark) disponibles.mark = `/canon/${haciaRel}`;
      copiados.push(haciaRel);
    }
  }
  mkdirSync(path.join(destino, "03_identidad"), { recursive: true });
  writeFileSync(path.join(destino, "03_identidad/disponibles.json"), `${JSON.stringify(disponibles, null, 2)}\n`);

  const manifiesto = JSON.parse(readFileSync(path.join(destino, "01_canon/manifiesto.json"), "utf8")) as Manifiesto;
  const catalogo = construirCatalogo(manifiesto, destino, "/canon");
  volcarCatalogo(catalogo, destino);
  const informe = informeDisponibilidad(manifiesto, (ruta) => existsSync(path.join(destino, ruta)));
  if (temporal) rmSync(temporal, { recursive: true, force: true });
  return { ok: faltan.length === 0, origen, copiados, faltan, reproducibles: informe.reproducibles, errores: [] };
}
