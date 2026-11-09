import creditos from "../../../content/obras/creditos.json";

export type { ObraVisible } from "./obras-visibles";
export { obraAvif, obraDeEpisodio, obraWebp, obrasVisibles, rotuloObra } from "./obras-visibles";

type CreditoObra = {
  id?: string;
  episodio?: string;
  principal?: boolean;
  uso?: string;
  titulo?: { es?: string; en?: string };
  autor?: { es?: string; en?: string };
  fecha?: string;
  ubicacion?: { es?: string; en?: string };
  placa?: { es?: string; en?: string };
  escena?: { es?: string; en?: string };
};

export function textoVerificado(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && !/PENDIENTE/i.test(value);
}

export function creditoDeObraVerificado(obra: CreditoObra): boolean {
  if (obra.principal !== true || obra.uso !== "principal") return false;
  return [
    obra.titulo?.es,
    obra.titulo?.en,
    obra.autor?.es,
    obra.autor?.en,
    obra.fecha,
    obra.ubicacion?.es,
    obra.ubicacion?.en,
    obra.placa?.es,
    obra.placa?.en,
    obra.escena?.es,
    obra.escena?.en,
  ].every(textoVerificado);
}

export function obrasDesdeCreditos(lista: CreditoObra[]): string[] {
  return lista.filter(creditoDeObraVerificado).map((obra) => obra.id ?? "").filter(Boolean);
}

const archivo = creditos as { obras?: CreditoObra[] };

export function idsVisiblesEnCreditos(): string[] {
  return obrasDesdeCreditos(archivo.obras ?? []);
}
