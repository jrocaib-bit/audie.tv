/**
 * Paginación por líneas del lector. Sin React Native: se prueba con Vitest.
 *
 * El texto de cada bloque se mide una vez a su ancho útil (en nativo, con `onTextLayout`; en web, con
 * `estimarLineas`). Aquí solo se reparten esas líneas en páginas del alto disponible. Un bloque que cruza
 * de página se pinta entero dentro de un recorte, desplazado hacia arriba las líneas que ya se leyeron,
 * de modo que los saltos de línea y los guiones son los medidos.
 */

export type BloqueMedido = {
  id: string;
  /** Líneas medidas al ancho de la página. */
  lineas: number;
  /** Alto de cada línea en píxeles (el `lineHeight` del bloque). */
  altoLinea: number;
  /** Espacio sobre el bloque si no abre página. */
  antes: number;
  /** No se parte entre páginas (cabecera del capítulo). */
  indivisible?: boolean;
  /** Se queda con el bloque siguiente (subtítulos). */
  conSiguiente?: boolean;
};

export type Fragmento = { bloque: number; desde: number; hasta: number };
export type PaginaTexto = { fragmentos: Fragmento[] };

export const MIN_LINEAS = 2;

export function paginar(bloques: readonly BloqueMedido[], alto: number, minLineas: number = MIN_LINEAS): PaginaTexto[] {
  const paginas: PaginaTexto[] = [];
  let actual: Fragmento[] = [];
  let usado = 0;
  const cerrar = () => {
    if (actual.length > 0) paginas.push({ fragmentos: actual });
    actual = [];
    usado = 0;
  };
  const colocar = (bloque: number, desde: number, hasta: number, antes: number, altoLinea: number) => {
    actual.push({ bloque, desde, hasta });
    usado += antes + (hasta - desde) * altoLinea;
  };
  const alturaMinima = (b: BloqueMedido | undefined) => (b ? b.antes + Math.min(b.lineas, minLineas) * b.altoLinea : 0);

  for (let i = 0; i < bloques.length; i += 1) {
    const b = bloques[i] as BloqueMedido;
    if (b.lineas <= 0) continue;
    let desde = 0;
    while (desde < b.lineas) {
      const antes = actual.length === 0 || desde > 0 ? 0 : b.antes;
      const restantes = b.lineas - desde;
      const libre = alto - usado - antes;
      const caben = Math.floor(libre / b.altoLinea);
      const siguiente = b.conSiguiente ? bloques[i + 1] : undefined;
      if (caben >= restantes) {
        if (siguiente && actual.length > 0 && libre < restantes * b.altoLinea + alturaMinima(siguiente)) {
          cerrar();
          continue;
        }
        colocar(i, desde, b.lineas, antes, b.altoLinea);
        desde = b.lineas;
        break;
      }
      if (actual.length > 0 && (b.indivisible || (desde === 0 && caben < minLineas))) {
        cerrar();
        continue;
      }
      let toma = Math.max(1, caben);
      if (!b.indivisible && restantes - toma < minLineas && restantes - minLineas >= minLineas) toma = restantes - minLineas;
      if (b.indivisible) toma = restantes;
      colocar(i, desde, desde + toma, antes, b.altoLinea);
      desde += toma;
      cerrar();
    }
  }
  cerrar();
  return paginas;
}

/** Líneas de un texto al ancho dado, con una media de ancho de carácter. Es la estimación de la web. */
export function estimarLineas(texto: string, anchoPx: number, tamano: number, anchoCaracter = 0.5): number {
  const porLinea = Math.max(8, Math.floor(anchoPx / (tamano * anchoCaracter)));
  let lineas = 0;
  for (const parrafo of texto.split("\n")) {
    let columna = 0;
    let n = 1;
    for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
      const largo = palabra.length;
      if (columna === 0) columna = largo;
      else if (columna + 1 + largo <= porLinea) columna += 1 + largo;
      else {
        n += 1;
        columna = largo;
      }
      while (columna > porLinea) {
        n += 1;
        columna -= porLinea;
      }
    }
    lineas += n;
  }
  return Math.max(1, lineas);
}

/** Índice de página (en el capítulo) que contiene el bloque. -1 si no está. */
export function paginaDeBloque(paginas: readonly PaginaTexto[], indiceBloque: number): number {
  return paginas.findIndex((p) => p.fragmentos.some((f) => f.bloque === indiceBloque));
}

export type CapituloPaginado = { id: string; paginas: number };

/** Página global (empezando en 1) con la que abre cada capítulo cargado, y el total de páginas. */
export function planDeLibro(capitulos: readonly CapituloPaginado[]): { inicios: Record<string, number>; total: number } {
  const inicios: Record<string, number> = {};
  let siguiente = 1;
  for (const c of capitulos) {
    inicios[c.id] = siguiente;
    siguiente += c.paginas;
  }
  return { inicios, total: siguiente - 1 };
}

/** Clave de la paginación guardada: libro, capítulo, tamaño de letra y ancho útil. */
export function claveMedida(libroId: string, capituloId: string, tam: number, ancho: number): string {
  return `audite.libros.medidas.v1.${libroId}.${capituloId}.${tam}.${Math.round(ancho)}`;
}

export function rotuloPagina(n: number, total: number): string {
  return `Página ${n} de ${total}`;
}
