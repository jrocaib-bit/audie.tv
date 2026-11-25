export type TipoSilueta = "bonnefanten" | "rijksmuseum" | "met" | "getty" | "clasico" | "biblioteca" | "capilla";
export type TipoSala = "galeria-ladrillo" | "galeria-holandesa" | "galeria-clasica" | "capilla-vitral" | "gabinete-estampas" | "galeria-piedra";
export type MedioObra = "pintura" | "vitral" | "estampa" | "piedra" | "lamina";

export type LugarObra = {
  id: string;
  lat: number | null;
  lon: number | null;
  ciudad: { es: string; en: string };
  edificio: { es: string; en: string };
  silueta: TipoSilueta;
  sala: TipoSala;
  coordenadasTexto: string;
};

type SedeBase = {
  id: string;
  patron: RegExp;
  lat: number | null;
  lon: number | null;
  ciudad: { es: string; en: string };
  edificio: { es: string; en: string };
  silueta: TipoSilueta;
  salaPorDefecto: TipoSala;
};

const SEDES: SedeBase[] = [
  {
    // Bonnefantenmuseum, Avenue Céramique 250 (Aldo Rossi, 1995). Allí está en préstamo desde 2004
    // «El paraíso» (SK-A-780) de Herri met de Bles, propiedad del Rijksmuseum.
    id: "bonnefanten",
    patron: /Bonnefanten/i,
    lat: 50.842529,
    lon: 5.701984,
    ciudad: { es: "Maastricht", en: "Maastricht" },
    edificio: { es: "Bonnefantenmuseum", en: "Bonnefantenmuseum" },
    silueta: "bonnefanten",
    salaPorDefecto: "galeria-ladrillo",
  },
  {
    id: "rijksmuseum",
    patron: /Rijksmuseum/i,
    lat: 52.36,
    lon: 4.88528,
    ciudad: { es: "Ámsterdam", en: "Amsterdam" },
    edificio: { es: "Rijksmuseum", en: "Rijksmuseum" },
    silueta: "rijksmuseum",
    salaPorDefecto: "galeria-holandesa",
  },
  {
    id: "met",
    patron: /Metropolitan Museum/i,
    lat: 40.77944,
    lon: -73.96333,
    ciudad: { es: "Nueva York", en: "New York" },
    edificio: { es: "The Metropolitan Museum of Art", en: "The Metropolitan Museum of Art" },
    silueta: "met",
    salaPorDefecto: "galeria-clasica",
  },
  {
    id: "cloisters",
    patron: /Cloisters/i,
    lat: 40.86486,
    lon: -73.93173,
    ciudad: { es: "Nueva York", en: "New York" },
    edificio: { es: "The Met Cloisters", en: "The Met Cloisters" },
    silueta: "capilla",
    salaPorDefecto: "galeria-piedra",
  },
  {
    id: "nga",
    patron: /National Gallery of Art/i,
    lat: 38.89139,
    lon: -77.02,
    ciudad: { es: "Washington", en: "Washington" },
    edificio: { es: "National Gallery of Art", en: "National Gallery of Art" },
    silueta: "clasico",
    salaPorDefecto: "galeria-clasica",
  },
  {
    id: "cleveland",
    patron: /Cleveland Museum/i,
    lat: 41.50889,
    lon: -81.61167,
    ciudad: { es: "Cleveland", en: "Cleveland" },
    edificio: { es: "Cleveland Museum of Art", en: "Cleveland Museum of Art" },
    silueta: "clasico",
    salaPorDefecto: "galeria-clasica",
  },
  {
    id: "getty",
    patron: /Getty Museum/i,
    lat: 34.0775,
    lon: -118.475,
    ciudad: { es: "Los Ángeles", en: "Los Angeles" },
    edificio: { es: "J. Paul Getty Museum", en: "J. Paul Getty Museum" },
    silueta: "getty",
    salaPorDefecto: "galeria-clasica",
  },
  {
    id: "berlin",
    patron: /Gemäldegalerie|Berlin/i,
    lat: 52.50861,
    lon: 13.36472,
    ciudad: { es: "Berlín", en: "Berlin" },
    edificio: { es: "Gemäldegalerie", en: "Gemäldegalerie" },
    silueta: "clasico",
    salaPorDefecto: "galeria-holandesa",
  },
  {
    id: "varsovia",
    patron: /Varsovia|Warsaw/i,
    lat: 52.2316,
    lon: 21.0247,
    ciudad: { es: "Varsovia", en: "Warsaw" },
    edificio: { es: "Museo Nacional de Varsovia", en: "National Museum in Warsaw" },
    silueta: "clasico",
    salaPorDefecto: "galeria-clasica",
  },
  {
    id: "londres",
    patron: /National Gallery,\s*Lond/i,
    lat: 51.5089,
    lon: -0.1283,
    ciudad: { es: "Londres", en: "London" },
    edificio: { es: "The National Gallery", en: "The National Gallery" },
    silueta: "clasico",
    salaPorDefecto: "galeria-clasica",
  },
  {
    id: "chicago",
    patron: /Art Institute of Chicago/i,
    lat: 41.87944,
    lon: -87.62389,
    ciudad: { es: "Chicago", en: "Chicago" },
    edificio: { es: "Art Institute of Chicago", en: "Art Institute of Chicago" },
    silueta: "clasico",
    salaPorDefecto: "galeria-clasica",
  },
  {
    id: "prado",
    patron: /Prado/i,
    lat: 40.4138,
    lon: -3.6921,
    ciudad: { es: "Madrid", en: "Madrid" },
    edificio: { es: "Museo del Prado", en: "Museo del Prado" },
    silueta: "clasico",
    salaPorDefecto: "galeria-clasica",
  },
  {
    id: "louvre",
    patron: /Louvre/i,
    lat: 48.8606,
    lon: 2.3376,
    ciudad: { es: "París", en: "Paris" },
    edificio: { es: "Musée du Louvre", en: "Musée du Louvre" },
    silueta: "clasico",
    salaPorDefecto: "galeria-clasica",
  },
  {
    id: "uffizi",
    patron: /Uffizi/i,
    lat: 43.7678,
    lon: 11.2553,
    ciudad: { es: "Florencia", en: "Florence" },
    edificio: { es: "Galleria degli Uffizi", en: "Uffizi Galleries" },
    silueta: "clasico",
    salaPorDefecto: "galeria-clasica",
  },
  {
    id: "rylands",
    patron: /John Rylands/i,
    lat: 53.4804,
    lon: -2.2487,
    ciudad: { es: "Mánchester", en: "Manchester" },
    edificio: { es: "The John Rylands Library", en: "The John Rylands Library" },
    silueta: "biblioteca",
    salaPorDefecto: "gabinete-estampas",
  },
];

/** Coordenadas de cada sede (para el vuelo en vivo de sala-vuelo.ts). */
export const SEDES_COORDENADAS: Record<string, { lat: number | null; lon: number | null }> = Object.fromEntries(
  SEDES.map((s) => [s.id, { lat: s.lat, lon: s.lon }]),
);

export function formatearCoordenadas(lat: number | null, lon: number | null): string {
  if (lat == null || lon == null || !Number.isFinite(lat) || !Number.isFinite(lon)) return "";
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}° ${ns} · ${Math.abs(lon).toFixed(2)}° ${ew}`;
}

export function inferirMedio(episodioId: string, ubicacion: string, medioExplicito?: MedioObra): MedioObra {
  if (medioExplicito) return medioExplicito;
  if (["is-01", "is-02", "is-04"].includes(episodioId)) return "vitral";
  if (["ex-12", "lv-01"].includes(episodioId)) return "piedra";
  if (
    ["gn-04", "gn-09", "ex-03", "ex-04", "ex-05", "ex-15", "ex-16", "ex-17", "ex-18", "lv-03", "lv-06", "lv-08", "is-17", "mt-11"].includes(
      episodioId,
    )
  ) {
    return "estampa";
  }
  if (/Lámina|Ilustración|Estampa/i.test(ubicacion)) return "lamina";
  return "pintura";
}

export function resolverLugarObra(ubicacion: string, episodioId: string, medioExplicito?: MedioObra, sedeId?: string): LugarObra {
  const medio = inferirMedio(episodioId, ubicacion, medioExplicito);
  const sede = (sedeId ? SEDES.find((s) => s.id === sedeId) : undefined) ?? SEDES.find((s) => s.patron.test(ubicacion));

  if (sede) {
    let sala = sede.salaPorDefecto;
    let silueta = sede.silueta;
    if (medio === "vitral") {
      sala = "capilla-vitral";
      silueta = "capilla";
    } else if (medio === "estampa" || medio === "lamina") {
      sala = "gabinete-estampas";
    } else if (medio === "piedra") {
      sala = "galeria-piedra";
    }
    return {
      id: sede.id,
      lat: sede.lat,
      lon: sede.lon,
      ciudad: sede.ciudad,
      edificio: sede.edificio,
      silueta,
      sala,
      coordenadasTexto: formatearCoordenadas(sede.lat, sede.lon),
    };
  }

  return {
    id: "gabinete",
    lat: null,
    lon: null,
    ciudad: { es: "", en: "" },
    edificio: { es: "", en: "" },
    silueta: medio === "vitral" ? "capilla" : "biblioteca",
    sala: medio === "vitral" ? "capilla-vitral" : medio === "estampa" || medio === "lamina" ? "gabinete-estampas" : "galeria-clasica",
    coordenadasTexto: "",
  };
}
