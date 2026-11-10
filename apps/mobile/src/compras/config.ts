/** Identificadores de App Store Connect. Android sigue en placeholder. */
export const APPLE_APP_ID = "6833136641";
export const BUNDLE_ID = "tv.audite.app";
export const GRUPO_SUSCRIPCION = "Audite Premium";

export const PRODUCTOS = {
  mensual: {
    apple: "audite.premium.mensual",
    android: "placeholder.audite.premium.mensual",
  },
  anual: {
    apple: "audite.premium.anual",
    android: "placeholder.audite.premium.anual",
  },
} as const;

export const IDS_APPLE = [PRODUCTOS.mensual.apple, PRODUCTOS.anual.apple] as const;

/** Apagado: el paywall se muestra y requestPurchase no se llama. */
export const PURCHASES_ENABLED = false;
