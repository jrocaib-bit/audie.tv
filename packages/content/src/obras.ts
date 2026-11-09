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

export function portadasCredito(): { id: string; episodio: string }[] {
  return (archivo.obras ?? []).flatMap((obra) => {
    if (!creditoDeObraVerificado(obra) || !obra.id || !obra.episodio) return [];
    return [{ id: obra.id, episodio: obra.episodio }];
  });
}

export function portadaPara(clave: string, evitar: readonly string[] = []): string | null {
  const lista = portadasCredito();
  if (lista.length === 0) return null;
  const directa = lista.find((obra) => obra.episodio === clave || obra.id === clave);
  if (directa && !evitar.includes(directa.episodio)) return directa.episodio;
  let indice = 0;
  for (let i = 0; i < clave.length; i += 1) indice = (indice * 33 + clave.charCodeAt(i)) % 997;
  for (let salto = 0; salto < lista.length; salto += 1) {
    const obra = lista[(indice + salto) % lista.length];
    if (obra && !evitar.includes(obra.episodio)) return obra.episodio;
  }
  return lista[indice % lista.length]?.episodio ?? null;
}
