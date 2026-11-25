import type { AppCatalog } from "@audite/domain";

export type CapaEstilo = Record<string, { es?: string; en?: string }>;
type Episodio = AppCatalog["episodes"][number];

/** Aplica la capa de estilo (content/catalog/resumenes-estilo.json) sobre summary.es/en; sin entrada, el episodio queda igual. */
export function aplicarEstiloResumenes(episodios: Episodio[], capa: CapaEstilo): Episodio[] {
  return episodios.map((episodio) => {
    const sobre = capa[episodio.id];
    if (!sobre) return episodio;
    return {
      ...episodio,
      summary: {
        es: (sobre.es ?? episodio.summary?.es ?? "").trim(),
        en: (sobre.en ?? episodio.summary?.en ?? "").trim(),
      },
    };
  });
}
