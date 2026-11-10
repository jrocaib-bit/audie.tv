import { fetchProducts, finishTransaction, getAvailablePurchases, initConnection, requestPurchase, type ProductSubscriptionIOS, type Purchase } from "expo-iap";
import { PURCHASES_ENABLED } from "./config";
import type { OfertaStore, Transaccion } from "./tienda";

function pruebaDe(producto: ProductSubscriptionIOS): OfertaStore["prueba"] {
  const oferta = producto.subscriptionOffers?.find((item) => item.type === "introductory" && item.paymentMode === "free-trial");
  const periodo = oferta?.period;
  if (oferta && periodo && periodo.unit !== "unknown") {
    return { modo: "free-trial", unidad: periodo.unit, valor: (oferta.periodCount ?? 1) * periodo.value };
  }
  const unidad = producto.introductoryPriceSubscriptionPeriodIOS;
  if (producto.introductoryPricePaymentModeIOS === "free-trial" && unidad && unidad !== "empty") {
    const periodos = Number(producto.introductoryPriceNumberOfPeriodsIOS ?? "1");
    return { modo: "free-trial", unidad, valor: Number.isFinite(periodos) && periodos > 0 ? periodos : 1 };
  }
  return null;
}

function transaccionDe(compra: Purchase): Transaccion {
  const expira = "expirationDateIOS" in compra ? compra.expirationDateIOS ?? null : null;
  const revocada = "revocationDateIOS" in compra ? Boolean(compra.revocationDateIOS) : false;
  return {
    productId: compra.productId,
    estado: compra.purchaseState === "purchased" ? "purchased" : compra.purchaseState === "pending" ? "pending" : "unknown",
    expira,
    revocada,
  };
}

export async function leerTienda(skus: readonly string[]): Promise<OfertaStore[] | null> {
  await initConnection();
  const productos = await fetchProducts({ skus: [...skus], type: "subs" });
  if (!productos) return null;
  return productos.flatMap((producto) => {
    if (producto.platform !== "ios" || producto.type !== "subs") return [];
    return [{ id: producto.id, displayPrice: producto.displayPrice, prueba: pruebaDe(producto) }];
  });
}

export async function comprar(id: string): Promise<void> {
  if (!PURCHASES_ENABLED) return;
  await initConnection();
  await requestPurchase({
    request: { apple: { sku: id }, google: { skus: [id] } },
    type: "subs",
  });
  const compras = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
  for (const compra of compras) {
    if (compra.productId === id) await finishTransaction({ purchase: compra, isConsumable: false });
  }
}

export async function restaurar(): Promise<Transaccion[]> {
  await initConnection();
  const compras = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
  return compras.map(transaccionDe);
}
