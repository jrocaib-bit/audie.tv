import type { CapituloLibro } from "@audite/domain";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { guardarMedidas, leerMedidas } from "../almacen";
import { SANGRIA, llevaSangria, metricas } from "../lector-estilo";
import { claveMedida, estimarLineas } from "../paginacion";

/** Líneas por bloque de cada capítulo cargado: [título, bloque 0, bloque 1, …]. */
export function lineasEstimadas(capitulo: CapituloLibro, tamano: number, ancho: number): number[] {
  const { fsTitulo } = metricas(tamano);
  return [
    estimarLineas(capitulo.titulo, ancho, fsTitulo, 0.52),
    ...capitulo.bloques.map((b, i) => estimarLineas((llevaSangria(b, capitulo.bloques[i - 1]) ? SANGRIA : "") + b.texto, ancho, b.tipo === "subtitulo" ? tamano * 1.08 : tamano, 0.52)),
  ];
}

type Estado = { llave: string; datos: Record<string, number[]>; leidos: string[] };

/**
 * Medidas de los capítulos al tamaño y ancho actuales. En nativo salen de `onTextLayout` (MedidorCapitulo) y se
 * guardan en AsyncStorage por libro, capítulo, tamaño y ancho. En web se estiman por caracteres.
 */
export function useMedidas({ libroId, capitulos, tam, tamano, ancho, nativo }: { libroId: string; capitulos: CapituloLibro[]; tam: number; tamano: number; ancho: number; nativo: boolean }) {
  const llave = `${tam}|${Math.round(ancho)}`;
  const [estado, setEstado] = useState<Estado>({ llave, datos: {}, leidos: [] });
  const pedidos = useRef(new Set<string>());
  const vigente = estado.llave === llave ? estado : { llave, datos: {}, leidos: [] };

  const estimadas = useMemo<Record<string, number[]>>(() => {
    if (nativo) return {};
    return Object.fromEntries(capitulos.map((c) => [c.id, lineasEstimadas(c, tamano, ancho)]));
  }, [nativo, capitulos, tamano, ancho]);

  useEffect(() => {
    if (!nativo) return;
    for (const c of capitulos) {
      const clave = claveMedida(libroId, c.id, tam, ancho);
      if (pedidos.current.has(clave)) continue;
      pedidos.current.add(clave);
      void leerMedidas(clave).then((lineas) => {
        const buenas = lineas && lineas.length === c.bloques.length + 1 ? lineas : null;
        setEstado((previo) => {
          const base = previo.llave === llave ? previo : { llave, datos: {}, leidos: [] };
          return { llave, datos: buenas ? { ...base.datos, [c.id]: buenas } : base.datos, leidos: [...base.leidos, c.id] };
        });
      });
    }
  }, [nativo, capitulos, libroId, tam, ancho, llave]);

  const registrar = useCallback(
    (capituloId: string, lineas: number[]) => {
      setEstado((previo) => {
        const base = previo.llave === llave ? previo : { llave, datos: {}, leidos: [] };
        return { llave, datos: { ...base.datos, [capituloId]: lineas }, leidos: base.leidos };
      });
      void guardarMedidas(claveMedida(libroId, capituloId, tam, ancho), lineas);
    },
    [libroId, tam, ancho, llave],
  );

  const medidas = nativo ? vigente.datos : estimadas;
  // Capítulos cargados cuya medida no estaba guardada: se miden en pantalla.
  const porMedir = nativo ? capitulos.filter((c) => !vigente.datos[c.id] && vigente.leidos.includes(c.id)) : [];
  return { medidas, porMedir, registrar };
}
