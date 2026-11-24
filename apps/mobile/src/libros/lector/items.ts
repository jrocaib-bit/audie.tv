/** Páginas del libro en el orden de lectura. Sin React Native: se prueba con Vitest. */
import type { EntradaIndice } from "@audite/domain";
import { bloquesMedibles } from "../lector-estilo";
import { paginar, type BloqueMedido, type Fragmento } from "../paginacion";

export type ItemLector =
  | { clave: string; tipo: "texto"; capId: string; idx: number; numero: number; fragmentos: Fragmento[]; medibles: BloqueMedido[] }
  | { clave: string; tipo: "corte"; capId: string; numero: number }
  | { clave: string; tipo: "cargando"; capId: string; numero: number };

type CapituloPlano = { bloques: { id: string; tipo: "parrafo" | "pasaje" | "subtitulo" }[] };

export type PlanLector = {
  items: ItemLector[];
  /** Páginas de texto del libro cargado hasta ahora. */
  total: number;
  /** Página con la que abre cada capítulo, solo si todos los anteriores están cargados. */
  inicios: Record<string, number>;
};

/**
 * Recorre el índice en orden. Un capítulo cargado y medido aporta sus páginas. Uno permitido pero sin cargar
 * aporta una página de espera. El primero que no se puede leer (sin suscripción) cierra con la página de corte.
 */
export function construirItems(opciones: {
  indice: readonly EntradaIndice[];
  capitulos: Record<string, CapituloPlano | undefined>;
  medidas: Record<string, number[] | undefined>;
  tamano: number;
  altoPagina: number;
  premium: boolean;
  bloqueados: ReadonlySet<string>;
}): PlanLector {
  const items: ItemLector[] = [];
  const inicios: Record<string, number> = {};
  let contador = 0;
  let completo = true;
  for (const entrada of opciones.indice) {
    if (opciones.bloqueados.has(entrada.id) || (!opciones.premium && !entrada.es_adelanto)) {
      items.push({ clave: `corte-${entrada.id}`, tipo: "corte", capId: entrada.id, numero: Math.max(1, contador) });
      break;
    }
    const capitulo = opciones.capitulos[entrada.id];
    const lineas = opciones.medidas[entrada.id];
    if (!capitulo || !lineas || lineas.length !== capitulo.bloques.length + 1) {
      if (completo) inicios[entrada.id] = contador + 1;
      completo = false;
      items.push({ clave: `espera-${entrada.id}`, tipo: "cargando", capId: entrada.id, numero: Math.max(1, contador) });
      continue;
    }
    const medibles = bloquesMedibles(capitulo, lineas, opciones.tamano);
    const paginas = paginar(medibles, opciones.altoPagina);
    if (completo) inicios[entrada.id] = contador + 1;
    paginas.forEach((pagina, idx) => {
      contador += 1;
      items.push({ clave: `${entrada.id}-${idx}`, tipo: "texto", capId: entrada.id, idx, numero: contador, fragmentos: pagina.fragmentos, medibles });
    });
  }
  return { items, total: contador, inicios };
}

/** Índice de la página que contiene el ancla (capítulo y bloque). Sin bloque, la primera del capítulo. -1 si no está. */
export function ubicarAncla(items: readonly ItemLector[], capId: string | null, bloqueIndice: number | null): number {
  if (!capId) return -1;
  if (bloqueIndice !== null) {
    const exacta = items.findIndex((i) => i.tipo === "texto" && i.capId === capId && i.fragmentos.some((f) => f.bloque === bloqueIndice + 1));
    if (exacta >= 0) return exacta;
  }
  return items.findIndex((i) => i.capId === capId);
}

/** Bloque (índice en el capítulo) con el que empieza una página, o null si solo lleva la cabecera. */
export function primerBloqueDePagina(item: ItemLector | undefined): number | null {
  if (!item || item.tipo !== "texto") return null;
  const f = item.fragmentos.find((x) => x.bloque > 0);
  return f ? f.bloque - 1 : null;
}
