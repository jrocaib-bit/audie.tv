import recorridosJson from "./datos/recorridos-sala.json";

export type TextoBilingue = { es: string; en: string };

export type PasoRecorrido = {
  x: number;
  y: number;
  zoom: number;
  titulo: TextoBilingue;
  texto: TextoBilingue;
};

export type RecorridoSala = {
  apertura: { titulo: TextoBilingue; texto: TextoBilingue };
  pasos: PasoRecorrido[];
  cierre: { titulo: TextoBilingue; texto: TextoBilingue };
};

export type ParadaNarrativa = {
  tipo: "apertura" | "detalle" | "cierre";
  indice: number;
  x?: number;
  y?: number;
  zoom: number;
  titulo: string;
  texto: string;
};

export type CamaraKeyframe = {
  scale: number;
  tx: number;
  ty: number;
  salaOpacity: number;
  puntosOpacity: number;
};

const RECORRIDOS = recorridosJson as Record<string, RecorridoSala>;

export function episodiosConRecorrido(): string[] {
  return Object.keys(RECORRIDOS);
}

export function recorridoCrudo(episodioId: string): RecorridoSala | null {
  return RECORRIDOS[episodioId] ?? null;
}

function textoDe(valor: TextoBilingue | undefined, lang: "es" | "en", respaldo = ""): string {
  const elegido = valor?.[lang]?.trim() || valor?.es?.trim() || "";
  return elegido || respaldo.trim();
}

/**
 * Devuelve la secuencia de paradas narrativas (apertura + detalles + cierre).
 * Si el episodio no tiene recorrido curado, genera un recorrido sencillo con la obra entera y su resumen narrativo.
 */
export function paradasDeEpisodio(
  episodioId: string,
  lang: "es" | "en",
  respaldo: { tituloObra: string; resumen?: string; tituloEpisodio?: string },
): { paradas: ParadaNarrativa[]; curado: boolean } {
  const crudo = RECORRIDOS[episodioId];
  if (crudo && crudo.pasos.length > 0) {
    const apertura: ParadaNarrativa = {
      tipo: "apertura",
      indice: 0,
      zoom: 1,
      titulo: textoDe(crudo.apertura.titulo, lang, respaldo.tituloObra || respaldo.tituloEpisodio || ""),
      texto: textoDe(crudo.apertura.texto, lang, respaldo.resumen ?? ""),
    };
    const detalles: ParadaNarrativa[] = crudo.pasos.map((paso, idx) => ({
      tipo: "detalle",
      indice: idx + 1,
      x: Math.min(0.95, Math.max(0.05, paso.x)),
      y: Math.min(0.95, Math.max(0.05, paso.y)),
      zoom: Math.min(3.5, Math.max(1.4, paso.zoom)),
      titulo: textoDe(paso.titulo, lang),
      texto: textoDe(paso.texto, lang),
    }));
    const cierre: ParadaNarrativa = {
      tipo: "cierre",
      indice: detalles.length + 1,
      zoom: 1,
      titulo: textoDe(crudo.cierre.titulo, lang, respaldo.tituloObra || ""),
      texto: textoDe(crudo.cierre.texto, lang, respaldo.resumen ?? ""),
    };
    return { paradas: [apertura, ...detalles, cierre], curado: true };
  }

  const titulo = respaldo.tituloObra || respaldo.tituloEpisodio || "";
  const texto = respaldo.resumen?.trim() || "";
  return {
    curado: false,
    paradas: [
      {
        tipo: "apertura",
        indice: 0,
        zoom: 1,
        titulo,
        texto,
      },
      {
        tipo: "cierre",
        indice: 1,
        zoom: 1,
        titulo,
        texto,
      },
    ],
  };
}

/**
 * Calcula los keyframes de cámara para cada parada de scroll.
 * Mantiene la obra centrada y entera en apertura/cierre (`scale = 1`),
 * y viaja hacia el detalle `(x, y)` ubicándolo en la zona visual superior (despejando la tarjeta inferior).
 */
export function camaraDeParadas(
  paradas: readonly ParadaNarrativa[],
  imgW: number,
  imgH: number,
  stageW: number,
  stageH: number,
): CamaraKeyframe[] {
  const safeW = Math.max(1, imgW);
  const safeH = Math.max(1, imgH);
  const viewW = Math.max(1, stageW);
  const viewH = Math.max(1, stageH);

  return paradas.map((p) => {
    if (p.tipo !== "detalle" || p.x == null || p.y == null) {
      return {
        scale: 1,
        tx: 0,
        ty: 0,
        salaOpacity: 1,
        puntosOpacity: p.tipo === "apertura" ? 1 : 0.65,
      };
    }

    const s = p.zoom;
    const rawTx = -s * (p.x - 0.5) * safeW;
    // Desplaza el foco levemente hacia arriba (-9% del alto) para que no quede tapado por el texto narrativo inferior.
    const targetOffsetY = -viewH * 0.09;
    const rawTy = -s * (p.y - 0.5) * safeH + targetOffsetY;

    // Evita que la obra salga de escena dejando huecos excesivos.
    const maxTx = Math.max(0, (safeW * s) / 2 - viewW * 0.14);
    const maxTy = Math.max(viewH * 0.18, (safeH * s) / 2 - viewH * 0.08);

    const tx = Math.min(maxTx, Math.max(-maxTx, rawTx)) || 0;
    const ty = Math.min(maxTy, Math.max(-maxTy, rawTy)) || 0;

    return {
      scale: s,
      tx,
      ty,
      salaOpacity: 0.24,
      puntosOpacity: 0,
    };
  });
}
