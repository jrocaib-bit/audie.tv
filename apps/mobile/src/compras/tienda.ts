import { PRECIO } from "@audite/domain";
import { IDS_APPLE, PRODUCTOS } from "./config";

export type Plan = "mensual" | "anual";

export type OfertaStore = {
  id: string;
  displayPrice: string;
  prueba: { modo: string; unidad: string; valor: number } | null;
};

export type Transaccion = {
  productId: string;
  estado: "purchased" | "pending" | "unknown";
  expira: number | null;
  revocada: boolean;
  /** appAccountToken: el uuid de Supabase de quien compró. */
  cuenta: string | null;
};

export type LineaPrecio = {
  id: string;
  plan: Plan;
  precio: string;
  pruebaDias: number | null;
  origen: "tienda" | "estatico";
};

export type EntornoPrecio = "tienda" | "web" | "dev";

const DIAS: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };

export function diasDePrueba(prueba: OfertaStore["prueba"]): number | null {
  if (!prueba || prueba.modo !== "free-trial") return null;
  const base = DIAS[prueba.unidad];
  if (!base || !Number.isFinite(prueba.valor) || prueba.valor <= 0) return null;
  return base * prueba.valor;
}

export function lineasDePaywall(opciones: {
  entorno: EntornoPrecio;
  tienda: readonly OfertaStore[] | null;
  ids?: { mensual: string; anual: string };
  estatico?: { mes: string; anio: string; pruebaDias: number };
}): LineaPrecio[] {
  const ids = opciones.ids ?? { mensual: PRODUCTOS.mensual.apple, anual: PRODUCTOS.anual.apple };
  const estatico = opciones.estatico ?? PRECIO;
  if (opciones.entorno !== "tienda") {
    return [
      { id: ids.mensual, plan: "mensual", precio: estatico.mes, pruebaDias: estatico.pruebaDias, origen: "estatico" },
      { id: ids.anual, plan: "anual", precio: estatico.anio, pruebaDias: estatico.pruebaDias, origen: "estatico" },
    ];
  }
  return (["mensual", "anual"] as const).map((plan) => {
    const id = ids[plan];
    const oferta = opciones.tienda?.find((item) => item.id === id);
    return {
      id,
      plan,
      precio: oferta?.displayPrice ?? "",
      pruebaDias: oferta ? diasDePrueba(oferta.prueba) : null,
      origen: "tienda" as const,
    };
  });
}

export const URL_CONDICIONES = "https://audite.tv/es/condiciones";
export const URL_PRIVACIDAD = "https://audite.tv/es/privacidad";

/** Letra que Apple pide junto al precio: periodo, renovación y dónde se cancela. */
export function textoRenovacion(lang: "es" | "en", plan: Plan, precio: string): string {
  const limpio = precio.trim() || (plan === "anual" ? PRECIO.anio : PRECIO.mes);
  if (lang === "en") {
    const periodo = plan === "anual" ? "year" : "month";
    return `${limpio} per ${periodo}. Renews unless you cancel at least 24 hours before the period ends. Manage in Settings.`;
  }
  const periodo = plan === "anual" ? "año" : "mes";
  return `${limpio} al ${periodo}. Se renueva salvo que canceles al menos 24 h antes. Gestión en Ajustes.`;
}

export const TIENDA_DEMO: OfertaStore[] = [
  { id: PRODUCTOS.mensual.apple, displayPrice: "1,99 €", prueba: { modo: "free-trial", unidad: "week", valor: 1 } },
  { id: PRODUCTOS.anual.apple, displayPrice: "8,00 €", prueba: { modo: "free-trial", unidad: "week", valor: 1 } },
];

export async function pedirCompra(
  activo: boolean,
  id: string,
  tienda: { requestPurchase: (id: string) => Promise<void> },
): Promise<"omitida" | "pedida"> {
  if (!activo) return "omitida";
  await tienda.requestPurchase(id);
  return "pedida";
}

/**
 * Derecho de la cuenta que ha iniciado sesión, leído de StoreKit.
 * TODO: validar el recibo en Supabase antes de fiarse de esta concesión local.
 * TODO: sincronizar el resultado con public.subscription_status.
 */
export function derechoLocal(transacciones: readonly Transaccion[], ahora: number, ids: readonly string[] = IDS_APPLE, userId: string | null = null): { activo: boolean; producto: string | null } {
  if (!userId) return { activo: false, producto: null };
  const vivas = transacciones.filter((item) => ids.includes(item.productId) && item.cuenta === userId && item.estado === "purchased" && !item.revocada && item.expira != null && item.expira > ahora);
  const mejor = [...vivas].sort((a, b) => (b.expira ?? 0) - (a.expira ?? 0))[0];
  return mejor ? { activo: true, producto: mejor.productId } : { activo: false, producto: null };
}

export async function restaurarCompras(
  tienda: { restaurar: () => Promise<Transaccion[]> },
  ahora: number,
  ids: readonly string[] = IDS_APPLE,
  userId: string | null = null,
): Promise<{ transacciones: Transaccion[]; derecho: { activo: boolean; producto: string | null } }> {
  const transacciones = await tienda.restaurar();
  return { transacciones, derecho: derechoLocal(transacciones, ahora, ids, userId) };
}

function numeroDePrecio(precio: string): number | null {
  const m = precio.replace(/\s/g, "").match(/\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const n = Number(m[0].replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Porcentaje que se ahorra con el anual frente a doce meses sueltos (null si no se puede calcular). */
export function ahorroAnual(mes: string, anio: string): number | null {
  const m = numeroDePrecio(mes);
  const a = numeroDePrecio(anio);
  if (m === null || a === null) return null;
  const ahorro = Math.round((1 - a / (m * 12)) * 100);
  return ahorro > 0 ? ahorro : null;
}
