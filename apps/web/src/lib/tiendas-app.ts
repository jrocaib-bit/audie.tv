export const URL_APP_STORE = "https://apps.apple.com/app/id6833136641";
export const URL_PLAY_STORE = "https://play.google.com/store/apps/details?id=tv.audite.app";

export function tiendasVisibles(marca = process.env.STORES_LIVE): { apple: string; google: string } | null {
  if (marca !== "true") return null;
  return { apple: URL_APP_STORE, google: URL_PLAY_STORE };
}
