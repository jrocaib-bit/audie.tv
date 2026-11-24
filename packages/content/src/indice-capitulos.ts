import { construirIndice, librosDelIndice, type IndiceBiblia, type LibroIndice, type Manifiesto } from "@audite/domain";
import datos from "../../../content/canon/indice-capitulos.json";

/** El índice commiteado. Se regenera con `npm run indice:capitulos`. */
export function indiceCapitulos(): IndiceBiblia {
  return datos as IndiceBiblia;
}

export function libroDelIndice(id: string, indice: IndiceBiblia = indiceCapitulos()): LibroIndice | null {
  return librosDelIndice(indice).find((libro) => libro.id === id) ?? null;
}

/**
 * JSON estable: misma entrada, mismo texto. Cada capítulo ocupa una línea para que el diff se lea.
 * No lleva fecha de generación. La única marca es la fecha `actualizado` del propio manifiesto.
 */
export function serializarIndice(indice: IndiceBiblia): string {
  const crudos: string[] = [];
  const compacto = (valor: unknown) => {
    crudos.push(JSON.stringify(valor));
    return `@@crudo:${crudos.length - 1}@@`;
  };
  const copia = {
    ...indice,
    sin_rango: indice.sin_rango.map(compacto),
    testamentos: indice.testamentos.map((testamento) => ({
      ...testamento,
      secciones: testamento.secciones.map((seccion) => ({
        ...seccion,
        libros: seccion.libros.map((libro) => ({ ...libro, episodios: libro.episodios.map(compacto), capitulos: libro.capitulos.map(compacto) })),
      })),
    })),
  };
  const texto = JSON.stringify(copia, null, 2).replace(/"@@crudo:(\d+)@@"/g, (_, indiceCrudo: string) => crudos[Number(indiceCrudo)] ?? "null");
  return `${texto}\n`;
}

export function generarIndiceCapitulos(manifiesto: Manifiesto): string {
  return serializarIndice(construirIndice(manifiesto));
}
