import { existsSync } from "node:fs";
import path from "node:path";

/**
 * La entrada «Libros» de la navegación solo se muestra si existe la página índice
 * `/{lang}/libros`. La rama audite-libros añadirá ese archivo; aquí no hay contenido de libros.
 */
const CANDIDATAS = [
  "src/app/[lang]/libros/page.tsx",
  "src/app/[lang]/libros/page.ts",
  "apps/web/src/app/[lang]/libros/page.tsx",
  "apps/web/src/app/[lang]/libros/page.ts",
];

export const RUTA_LIBROS = "/libros";

export function hayIndiceLibros(raiz = process.cwd()): boolean {
  return CANDIDATAS.some((rel) => existsSync(path.join(raiz, rel)));
}
