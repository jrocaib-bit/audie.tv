import "server-only";
/**
 * Material de reportaje de La sala por obra. SOLO servidor.
 * `contextoSala`: público (va en el adelanto, no revela pasos). `reportajePremium`: radios de máscara y comparativa,
 * que solo salen en la respuesta premium de /api/sala/[id]. Sin datos para un id: null (la obra se pinta con valores por defecto).
 */
import type { ComparativaSala, ContextoSala } from "./sala-contexto";

type Bi = { es: string; en: string };
type Ficha = {
  cita: Bi;
  lineaTiempo: Bi[];
  mapa: { id: string; lat: number; lon: number; nombre: Bi; pie: Bi }[];
  /** Radio del foco por paso (fracción del lado menor del visor). */
  radios?: number[];
  comparativa?: { trasPaso: number; entrada: Bi; creditos: Bi; imagenes: { src: string; ancho: number; alto: number; alt: Bi; pie: Bi }[] };
};

const FICHAS: Record<string, Ficha> = {
  "gn-01": {
    cita: { es: "Una tabla redonda de nogal, pequeña, hecha para mirarse de cerca.", en: "A small round walnut panel, made to be looked at from close to." },
    lineaTiempo: [
      { es: "1535. Herry de Patenir queda inscrito como maestro libre en el gremio de pintores de Amberes.", en: "1535. Herry de Patenir is entered as a free master in the Antwerp painters' guild." },
      { es: "Hacia 1541. Se pinta el tondo de nogal, una tabla redonda de unos cuarenta y seis centímetros.", en: "Around 1541. The walnut tondo is painted, a round panel of about forty-six centimetres." },
      { es: "1882. La tabla sale a la venta en Ámsterdam, catalogada entonces como un Brueghel de terciopelo.", en: "1882. The panel is sold in Amsterdam, then catalogued as a work of Velvet Brueghel." },
      { es: "1963. Pasa a La Haya en un préstamo de larga duración.", en: "1963. It goes to The Hague on a long loan." },
      { es: "2004. La tabla viaja a Maastricht, de nuevo en préstamo.", en: "2004. The panel travels to Maastricht, again on loan." },
    ],
    mapa: [
      { id: "amberes", lat: 51.22, lon: 4.4, nombre: { es: "Amberes", en: "Antwerp" }, pie: { es: "Amberes, hacia 1540. El taller trabaja en la ciudad del gremio.", en: "Antwerp, around 1540. The workshop works in the city of the guild." } },
      { id: "amsterdam", lat: 52.37, lon: 4.9, nombre: { es: "Ámsterdam", en: "Amsterdam" }, pie: { es: "Ámsterdam, 1882. La venta pública abre la vida moderna de la tabla.", en: "Amsterdam, 1882. The public sale opens the modern life of the panel." } },
      { id: "la-haya", lat: 52.08, lon: 4.3, nombre: { es: "La Haya", en: "The Hague" }, pie: { es: "La Haya, de 1963 a 1997. La tabla permanece en préstamo.", en: "The Hague, from 1963 to 1997. The panel remains on loan." } },
      { id: "maastricht", lat: 50.85, lon: 5.69, nombre: { es: "Maastricht", en: "Maastricht" }, pie: { es: "Maastricht, desde 2004. La obra se contempla hoy en préstamo.", en: "Maastricht, since 2004. The work is seen today on loan." } },
    ],
    radios: [0.18, 0.22, 0.2, 0.18, 0.2],
    comparativa: {
      trasPaso: 5,
      entrada: { es: "Bles toma de Durero, invertidas, la caída y la expulsión.", en: "Bles takes the Fall and the Expulsion from Dürer, and reverses both scenes." },
      creditos: { es: "Grabados cedidos en CC0 por la National Gallery of Art de Washington, vía Wikimedia Commons.", en: "Woodcuts released under CC0 by the National Gallery of Art, Washington, via Wikimedia Commons." },
      imagenes: [
        { src: "/sala/comparativas/gn-01/durero-caida.webp", ancho: 1000, alto: 1316, alt: { es: "Grabado de Durero: Adán y Eva ante el árbol", en: "Dürer woodcut: Adam and Eve at the tree" }, pie: { es: "Alberto Durero. La caída, de la Pequeña Pasión, hacia 1510.", en: "Albrecht Dürer. The Fall of Man, from the Small Passion, around 1510." } },
        { src: "/sala/comparativas/gn-01/durero-expulsion.webp", ancho: 1000, alto: 1273, alt: { es: "Grabado de Durero: la expulsión del paraíso", en: "Dürer woodcut: the expulsion from Paradise" }, pie: { es: "Alberto Durero. La expulsión del paraíso, de la Pequeña Pasión, 1510.", en: "Albrecht Dürer. The Expulsion from Paradise, from the Small Passion, 1510." } },
      ],
    },
  },
};

const ficha = (id: string): Ficha | null => (Object.prototype.hasOwnProperty.call(FICHAS, id) ? FICHAS[id]! : null);

export function contextoSala(id: string, lang: "es" | "en"): ContextoSala | null {
  const f = ficha(id);
  if (!f) return null;
  return {
    cita: f.cita[lang],
    lineaTiempo: f.lineaTiempo.map((l) => l[lang]),
    mapa: f.mapa.map((p) => ({ id: p.id, lat: p.lat, lon: p.lon, nombre: p.nombre[lang], pie: p.pie[lang] })),
  };
}

/** Solo premium: radios por paso y comparativa. */
export function reportajePremium(id: string, lang: "es" | "en"): { radios: number[]; comparativa: ComparativaSala | null } {
  const f = ficha(id);
  const c = f?.comparativa;
  return {
    radios: f?.radios ?? [],
    comparativa: c ? { trasPaso: c.trasPaso, entrada: c.entrada[lang], creditos: c.creditos[lang], imagenes: c.imagenes.map((i) => ({ src: i.src, ancho: i.ancho, alto: i.alto, alt: i.alt[lang], pie: i.pie[lang] })) } : null,
  };
}
