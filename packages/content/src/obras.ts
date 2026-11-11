import creditos from "../../../content/obras/creditos.json";
import excepciones from "../../../content/obras/excepciones_repetidas.json";
import { esPortadaProvisional, obraDeEpisodio, obrasVisibles, obraWebp } from "./obras-visibles";

export type { ObraVisible } from "./obras-visibles";
export { esPortadaProvisional, episodiosSinObra, obraAvif, obraDeEpisodio, obraEnPantalla, obraWebp, obrasVisibles, rotuloObra } from "./obras-visibles";

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

function fichaDePortada(obra: ObraReto): PortadaReto | null {
  if (!obra.id || !obra.reto) return null;
  const titulo = { es: textoDe(obra.titulo, "es"), en: textoDe(obra.titulo, "en") };
  const autor = { es: textoDe(obra.autor, "es"), en: textoDe(obra.autor, "en") };
  const ubicacion = { es: textoDe(obra.ubicacion, "es"), en: textoDe(obra.ubicacion, "en") };
  if (!titulo.es || !autor.es || !ubicacion.es || !obra.fuente?.licencia) return null;
  return {
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
  };
}

/** El complemento _o2 es la imagen de la portada. La obra principal del reto no cambia de ficha. */
export function portadasDeRetos(): PortadaReto[] {
  const grupos = new Map<string, ObraReto[]>();
  for (const obra of retosArchivo.retos?.obras ?? []) {
    if (!obra.reto) continue;
    const lista = grupos.get(obra.reto) ?? [];
    lista.push(obra);
    grupos.set(obra.reto, lista);
  }
  const salida: PortadaReto[] = [];
  for (const lista of grupos.values()) {
    const complemento = lista.find((obra) => obra.uso === "complementaria" && obra.principal !== true);
    const principal = lista.find((obra) => obra.principal === true && obra.uso === "principal");
    const ficha = fichaDePortada(complemento ?? principal ?? {});
    if (ficha) salida.push(ficha);
  }
  return salida;
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

type FichaIdentidad = {
  id?: string;
  sha256?: string;
  titulo?: { es?: string };
  autor?: { es?: string };
  fuente?: { inventario?: string | null };
};

function claveVacia(valor: string | null | undefined): string {
  const texto = valor?.trim() ?? "";
  return texto.toLowerCase() === "null" ? "" : texto;
}

/** Episodios que no pueden pintar su cuadro si queremos que cada obra salga una sola vez. */
export function calcularPortadasProvisionales(): string[] {
  const sinObra = new Set(excepciones.pendientes);
  const fichas = creditos as { obras?: FichaIdentidad[]; retos?: { obras?: FichaIdentidad[] } };
  const porId = new Map((fichas.obras ?? []).map((obra) => [obra.id ?? "", obra]));
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    if (!parent.has(id)) parent.set(id, id);
    let cursor = id;
    while (parent.get(cursor) !== cursor) cursor = parent.get(cursor) ?? cursor;
    parent.set(id, cursor);
    return cursor;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  };
  const grupos = new Map<string, string>();
  const unir = (clave: string, id: string) => {
    const previo = grupos.get(clave);
    if (previo) union(previo, id);
    grupos.set(clave, id);
  };
  const obras = obrasVisibles();
  for (const obra of obras) {
    const ficha = porId.get(obra.id);
    unir(`ta:${obra.titulo.es.trim().toLowerCase()}|${obra.autor.es.trim().toLowerCase()}`, obra.episodio);
    const sha = claveVacia(ficha?.sha256);
    const inventario = claveVacia(ficha?.fuente?.inventario);
    if (sha) unir(`sha:${sha}`, obra.episodio);
    if (inventario) unir(`inv:${inventario}`, obra.episodio);
  }
  for (const portada of portadasDeRetos()) {
    const ficha = (fichas.retos?.obras ?? []).find((obra) => obra.id === portada.id);
    const nodo = `cover:${portada.id}`;
    unir(`ta:${portada.titulo.es.trim().toLowerCase()}|${portada.autor.es.trim().toLowerCase()}`, nodo);
    const sha = claveVacia(ficha?.sha256);
    const inventario = claveVacia(ficha?.fuente?.inventario);
    if (sha) unir(`sha:${sha}`, nodo);
    if (inventario) unir(`inv:${inventario}`, nodo);
  }
  const porRaiz = new Map<string, string[]>();
  for (const obra of obras) {
    const raiz = find(obra.episodio);
    const lista = porRaiz.get(raiz) ?? [];
    if (!lista.includes(obra.episodio)) lista.push(obra.episodio);
    porRaiz.set(raiz, lista);
  }
  const provisional: string[] = [];
  for (const grupo of porRaiz.values()) {
    if (grupo.length === 1 && !sinObra.has(grupo[0] ?? "")) continue;
    const keeper = grupo.find((episodio) => !sinObra.has(episodio));
    for (const episodio of grupo) {
      if (episodio !== keeper) provisional.push(episodio);
    }
  }
  return provisional;
}

export type IdentidadRenderizada = { id: string; sha256: string; inventario: string; tituloAutor: string };

/** Obras que de verdad se pintan: episodios que conservan su cuadro y portadas de reto. */
export function identidadesRenderizadas(): IdentidadRenderizada[] {
  const fichas = creditos as { obras?: FichaIdentidad[]; retos?: { obras?: FichaIdentidad[] } };
  const porId = new Map((fichas.obras ?? []).map((obra) => [obra.id ?? "", obra]));
  const salida: IdentidadRenderizada[] = [];
  for (const obra of obrasVisibles()) {
    if (esPortadaProvisional(obra.episodio)) continue;
    const ficha = porId.get(obra.id);
    salida.push({
      id: obra.episodio,
      sha256: claveVacia(ficha?.sha256),
      inventario: claveVacia(ficha?.fuente?.inventario),
      tituloAutor: `${obra.titulo.es.trim().toLowerCase()}|${obra.autor.es.trim().toLowerCase()}`,
    });
  }
  for (const portada of portadasDeRetos()) {
    const ficha = (fichas.retos?.obras ?? []).find((obra) => obra.id === portada.id);
    salida.push({
      id: portada.id,
      sha256: claveVacia(ficha?.sha256),
      inventario: claveVacia(ficha?.fuente?.inventario),
      tituloAutor: `${portada.titulo.es.trim().toLowerCase()}|${portada.autor.es.trim().toLowerCase()}`,
    });
  }
  return salida;
}
