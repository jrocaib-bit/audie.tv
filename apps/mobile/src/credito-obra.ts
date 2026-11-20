import creditos from "../../../content/obras/creditos.json";

type Obra = { id?: string; titulo?: { es?: string; en?: string }; autor?: { es?: string; en?: string } };

/** Crédito corto de una obra de reto: título y autor, como en el museo. */
export function creditoObraReto(id: string, lang: "es" | "en" = "es"): string {
  const obras = (creditos as { retos?: { obras?: Obra[] } }).retos?.obras ?? [];
  const obra = obras.find((item) => item.id === id);
  const titulo = obra?.titulo?.[lang]?.trim() || obra?.titulo?.es?.trim() || "";
  const autor = obra?.autor?.[lang]?.trim() || obra?.autor?.es?.trim() || "";
  if (!titulo || !autor) return "";
  return `${titulo} · ${autor}`;
}
