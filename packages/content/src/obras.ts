import creditos from "../../../content/obras/creditos.json";
import { obraDeEpisodio, obrasVisibles, obraWebp } from "./obras-visibles";

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
  return obrasVisibles().map((obra) => ({ id: obra.id, episodio: obra.episodio }));
}

export function portadaPara(clave: string, evitar: readonly string[] = [], giro = 0): string | null {
  const lista = portadasCredito();
  if (lista.length === 0) return null;
  const directa = lista.find((obra) => obra.episodio === clave || obra.id === clave);
  if (directa && !evitar.includes(directa.episodio) && giro === 0) return directa.episodio;
  let indice = Math.abs(giro);
  for (let i = 0; i < clave.length; i += 1) indice = (indice * 33 + clave.charCodeAt(i)) % 997;
  const inicio = (indice + Math.abs(giro)) % lista.length;
  for (let salto = 0; salto < lista.length; salto += 1) {
    const obra = lista[(inicio + salto) % lista.length];
    if (obra && !evitar.includes(obra.episodio)) return obra.episodio;
  }
  return lista[inicio]?.episodio ?? null;
}

export type FormatoPortada = "vertical" | "cuadrado" | "ancho";

export type PortadaReto = {
  id: string;
  retoId: string;
  titulo: { es: string; en: string };
  autor: { es: string; en: string };
  ubicacion: { es: string; en: string };
  licencia: string;
  src: Record<FormatoPortada, string>;
};

type ObraReto = {
  id?: string;
  principal?: boolean;
  uso?: string;
  reto?: string;
  titulo?: { es?: string; en?: string };
  autor?: { es?: string; en?: string };
  ubicacion?: { es?: string; en?: string };
  fuente?: { licencia?: string };
};

const retosArchivo = creditos as { retos?: { obras?: ObraReto[] } };

function textoDe(valor: { es?: string; en?: string } | undefined, lang: "es" | "en"): string {
  return valor?.[lang]?.trim() || valor?.es?.trim() || "";
}

export function portadasDeRetos(): PortadaReto[] {
  return (retosArchivo.retos?.obras ?? []).flatMap((obra) => {
    if (obra.principal !== true || obra.uso !== "principal" || !obra.id || !obra.reto) return [];
    const titulo = { es: textoDe(obra.titulo, "es"), en: textoDe(obra.titulo, "en") };
    const autor = { es: textoDe(obra.autor, "es"), en: textoDe(obra.autor, "en") };
    const ubicacion = { es: textoDe(obra.ubicacion, "es"), en: textoDe(obra.ubicacion, "en") };
    if (!titulo.es || !autor.es || !ubicacion.es || !obra.fuente?.licencia) return [];
    return [{
      id: obra.id,
      retoId: obra.reto,
      titulo,
      autor,
      ubicacion,
      licencia: obra.fuente.licencia,
      src: {
        vertical: `/obras/${obra.id}-9x16.webp`,
        cuadrado: `/obras/${obra.id}-1x1.webp`,
        ancho: `/obras/${obra.id}-16x9.webp`,
      },
    }];
  });
}

export function portadaDeReto(retoId: string): PortadaReto | null {
  return portadasDeRetos().find((portada) => portada.retoId === retoId) ?? null;
}

export function libroDeEpisodio(episodio: string): string {
  return episodio.replace(/-\d+$/, "");
}

export type PortadaHoy =
  | { tipo: "reto"; src: string; retoId: string }
  | { tipo: "episodio"; src: string; libroId: string; episodio: string }
  | { tipo: "tiempo" };

/** Portada del reto, obra verificada de ese episodio, o el tiempo litúrgico. Nunca otro libro. */
export function elegirPortadaHoy(datos: { retoId: string; libroId: string; episodio: string | null }): PortadaHoy {
  const portada = portadaDeReto(datos.retoId);
  if (portada) return { tipo: "reto", src: portada.src.ancho, retoId: portada.retoId };
  if (datos.episodio && libroDeEpisodio(datos.episodio) === datos.libroId) {
    const obra = obraDeEpisodio(datos.episodio);
    if (obra && libroDeEpisodio(obra.episodio) === datos.libroId) {
      return { tipo: "episodio", src: obraWebp(obra), libroId: datos.libroId, episodio: obra.episodio };
    }
  }
  return { tipo: "tiempo" };
}
