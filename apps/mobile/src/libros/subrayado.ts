/** Colores de subrayado del lector. El nombre es lo que se guarda en `color`, igual que hacen la web y la API. */
export const COLORES_SUBRAYADO = ["amarillo", "verde", "azul", "rosa"] as const;
export type ColorSubrayado = (typeof COLORES_SUBRAYADO)[number];

export const ROTULO_COLOR: Record<ColorSubrayado, string> = { amarillo: "Amarillo", verde: "Verde", azul: "Azul", rosa: "Rosa" };

const FONDO: Record<ColorSubrayado, [string, string]> = {
  // [sobre fondo claro (Día, Sepia), sobre fondo oscuro (Noche)]
  amarillo: ["rgba(242,201,76,0.55)", "rgba(242,201,76,0.38)"],
  verde: ["rgba(111,191,115,0.45)", "rgba(111,191,115,0.36)"],
  azul: ["rgba(100,160,235,0.42)", "rgba(100,160,235,0.40)"],
  rosa: ["rgba(240,128,160,0.42)", "rgba(240,128,160,0.40)"],
};
export const MUESTRA: Record<ColorSubrayado, string> = { amarillo: "#F2C94C", verde: "#6FBF73", azul: "#64A0EB", rosa: "#F080A0" };

/** Los subrayados antiguos guardan «oro»: se pintan como amarillo. Un nombre desconocido también. */
export function colorNormalizado(valor: string | null | undefined): ColorSubrayado {
  return (COLORES_SUBRAYADO as readonly string[]).includes(valor ?? "") ? (valor as ColorSubrayado) : "amarillo";
}

export function fondoSubrayado(valor: string | null | undefined, noche: boolean): string {
  return FONDO[colorNormalizado(valor)][noche ? 1 : 0];
}

export type MarcaLista =
  | { tipo: "subrayado"; id: string; capitulo_id: string; bloque_id: string; color: ColorSubrayado; fecha: string; texto: string }
  | { tipo: "marcador"; id: string; capitulo_id: string; bloque_id: string | null; fecha: string; texto: string }
  | { tipo: "nota"; id: string; capitulo_id: string; bloque_id: string | null; fecha: string; texto: string; subrayado_id: string | null };

type Anot = {
  marcadores: { id: string; capitulo_id: string; bloque_id: string | null; created_at: string }[];
  subrayados: { id: string; capitulo_id: string; bloque_id: string; inicio: number; fin: number; color: string; created_at: string }[];
  notas: { id: string; capitulo_id: string; bloque_id: string | null; subrayado_id: string | null; texto: string; created_at: string }[];
};

const recorte = (texto: string, max = 90) => (texto.length > max ? `${texto.slice(0, max).trimEnd()}…` : texto);

/** Lista para la hoja del índice: más recientes primero. `textoDe` devuelve el texto plano de un bloque. */
export function listaDeMarcas(anot: Anot, textoDe: (capituloId: string, bloqueId: string) => string | null): MarcaLista[] {
  const subrayados: MarcaLista[] = anot.subrayados.map((s) => ({
    tipo: "subrayado",
    id: s.id,
    capitulo_id: s.capitulo_id,
    bloque_id: s.bloque_id,
    color: colorNormalizado(s.color),
    fecha: s.created_at,
    texto: recorte((textoDe(s.capitulo_id, s.bloque_id) ?? "").slice(s.inicio, s.fin).trim()),
  }));
  const marcadores: MarcaLista[] = anot.marcadores.map((m) => ({
    tipo: "marcador",
    id: m.id,
    capitulo_id: m.capitulo_id,
    bloque_id: m.bloque_id,
    fecha: m.created_at,
    texto: m.bloque_id ? recorte((textoDe(m.capitulo_id, m.bloque_id) ?? "").trim()) : "Capítulo marcado",
  }));
  const notas: MarcaLista[] = anot.notas.map((n) => ({ tipo: "nota", id: n.id, capitulo_id: n.capitulo_id, bloque_id: n.bloque_id, fecha: n.created_at, texto: recorte(n.texto, 140), subrayado_id: n.subrayado_id }));
  return [...subrayados, ...marcadores, ...notas].sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));
}

/** Une dos rangos de frase del mismo bloque en uno solo. */
export function unirRangos(a: { inicio: number; fin: number }, b: { inicio: number; fin: number }): { inicio: number; fin: number } {
  return { inicio: Math.min(a.inicio, b.inicio), fin: Math.max(a.fin, b.fin) };
}
