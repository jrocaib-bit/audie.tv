import manifiesto from "../../../../content/canon/01_canon/manifiesto.json";

type Manifiesto = {
  libros: { episodios: { id: string; resumen?: { es?: string; en?: string } }[] }[];
};

const RESUMENES = new Map<string, { es: string; en: string }>();
for (const libro of (manifiesto as Manifiesto).libros) {
  for (const episodio of libro.episodios) {
    RESUMENES.set(episodio.id, {
      es: episodio.resumen?.es?.trim() ?? "",
      en: episodio.resumen?.en?.trim() ?? "",
    });
  }
}

export function resumenPublico(id: string, titulo: string, referencia: string, lang: "es" | "en"): { texto: string; generado: boolean } {
  const guardado = RESUMENES.get(id);
  const propio = lang === "en" ? (guardado?.en || guardado?.es) : guardado?.es;
  if (propio) return { texto: propio, generado: false };
  const texto = lang === "en"
    ? `${titulo}. Passage ${referencia}.`
    : `${titulo}. Pasaje ${referencia}.`;
  return { texto, generado: true };
}
