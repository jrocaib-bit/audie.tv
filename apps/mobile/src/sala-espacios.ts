/**
 * Datos y geometría de «La sala» (v2). Los ficheros se enlazan en sala-assets.ts.
 *
 * Assets fotográficos de «La sala» (v2): viaje desde el espacio, fachada real y sala.
 *
 * Origen y licencias (detalle completo en Créditos y en entrega/sala/LEEME.md):
 * - viaje/*.mp4 y *.webp: render propio. Tierra = NASA Blue Marble Next Generation (dominio público);
 *   ciudad = Sentinel-2 cloudless 2016 de EOX IT Services GmbH (CC BY 4.0, datos Copernicus Sentinel 2016);
 *   estrellas procedurales.
 * - edificios/*.webp: fotografías de Wikimedia Commons con CC0, CC BY 2.0 o dominio público (ver CREDITOS_EDIFICIOS).
 * - salas/*.webp: imágenes generadas para Audite inspiradas en el estilo verificable de cada museo;
 *   excepción: salas/bonnefanten-sala.webp es una fotografía real del interior del Bonnefantenmuseum (CC BY 2.0).
 * - Vuelo en vivo (gn-01 y, más adelante, el resto de sedes): Google Photorealistic 3D Tiles + CesiumJS, ver sala-vuelo.ts.
 * Ninguna obra se altera: la obra real se compone encima, entera, en la app.
 */
import espaciosJson from "./datos/sala-espacios.json";

export type SedeId =
  | "bonnefanten"
  | "rijksmuseum"
  | "met"
  | "cloisters"
  | "getty"
  | "nga"
  | "cleveland"
  | "berlin"
  | "varsovia"
  | "londres"
  | "chicago"
  | "rylands";

export type MedioSala = "pintura" | "vitral" | "estampa" | "lamina" | "objeto";

export type EspacioId =
  | "bonnefanten-sala"
  | "rijksmuseum-pintura"
  | "met-pintura"
  | "met-vitral"
  | "met-medieval"
  | "met-estampas"
  | "cloisters-vitral"
  | "cloisters-vitral-cuadrado"
  | "cloisters-sala"
  | "getty-pintura"
  | "nga-pintura"
  | "cleveland-pintura"
  | "berlin-pintura"
  | "varsovia-pintura"
  | "londres-pintura"
  | "chicago-pintura"
  | "rylands-lectura"
  | "gabinete";

export type EspacioEpisodio = {
  sede: SedeId | null;
  espacio: EspacioId;
  medio: MedioSala;
  galeria?: string | null;
  expuesta?: boolean;
  departamento?: string;
};

/** Caja normalizada (0..1) dentro de la imagen de sala donde va la obra. */
export type Ancla = { x0: number; y0: number; x1: number; y1: number };

export type Espacio = {
  /** Relación ancho/alto de la imagen. */
  aspecto: number;
  ancla: Ancla;
  tipo: "pared" | "ventana" | "atril";
};

export const ASPECTO_SALA = 864 / 1536;

/** Sedes con vídeo de viaje; las que tienen fachada fotográfica llevan crédito en CREDITOS_EDIFICIOS. */
export const SEDES_VIAJE: { id: SedeId | "sin-lugar"; edificio: boolean; /** Prefijo de los ficheros viaje/*.mp4 y *-inicio/final.webp. */ recurso: string }[] = [
  ...(["rijksmuseum", "met", "cloisters", "getty", "nga", "cleveland", "berlin", "varsovia", "londres", "chicago", "rylands"] as const).map((id) => ({ id, edificio: true, recurso: id })),
  // Bonnefanten aún no tiene su propio vídeo v2: el viaje genérico (sin lugar) hace de reserva visual si no hay vuelo en vivo.
  { id: "bonnefanten", edificio: true, recurso: "sin-lugar" },
  { id: "sin-lugar", edificio: false, recurso: "sin-lugar" },
];

const caja = (cx: number, cy: number, w: number, h: number): Ancla => ({ x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 });

export const ESPACIOS_GEOMETRIA: Record<EspacioId, Espacio> = {
  // Interior real del Bonnefantenmuseum (atrio de Aldo Rossi): la obra se coloca centrada y entera sobre el muro blanco.
  "bonnefanten-sala": { aspecto: ASPECTO_SALA, ancla: caja(0.486, 0.514, 0.27, 0.152), tipo: "pared" },
  "rijksmuseum-pintura": { aspecto: ASPECTO_SALA, ancla: caja(0.5, 0.37, 0.58, 0.3), tipo: "pared" },
  "met-pintura": { aspecto: ASPECTO_SALA, ancla: caja(0.5, 0.5, 0.56, 0.27), tipo: "pared" },
  "met-vitral": { aspecto: ASPECTO_SALA, ancla: { x0: 0.2403, y0: 0.3141, x1: 0.7611, y1: 0.6258 }, tipo: "ventana" },
  "met-medieval": { aspecto: ASPECTO_SALA, ancla: caja(0.5, 0.4, 0.58, 0.42), tipo: "pared" },
  "met-estampas": { aspecto: ASPECTO_SALA, ancla: caja(0.5, 0.36, 0.62, 0.4), tipo: "pared" },
  "cloisters-vitral": { aspecto: ASPECTO_SALA, ancla: { x0: 0.3875, y0: 0.2641, x1: 0.6125, y1: 0.6289 }, tipo: "ventana" },
  "cloisters-vitral-cuadrado": { aspecto: ASPECTO_SALA, ancla: { x0: 0.3083, y0: 0.2742, x1: 0.7, y1: 0.6344 }, tipo: "ventana" },
  "cloisters-sala": { aspecto: ASPECTO_SALA, ancla: caja(0.5, 0.5, 0.56, 0.52), tipo: "pared" },
  "getty-pintura": { aspecto: ASPECTO_SALA, ancla: caja(0.58, 0.45, 0.54, 0.4), tipo: "pared" },
  "nga-pintura": { aspecto: ASPECTO_SALA, ancla: caja(0.5, 0.45, 0.38, 0.2), tipo: "pared" },
  "cleveland-pintura": { aspecto: ASPECTO_SALA, ancla: caja(0.5, 0.47, 0.58, 0.24), tipo: "pared" },
  "berlin-pintura": { aspecto: ASPECTO_SALA, ancla: caja(0.4, 0.42, 0.5, 0.26), tipo: "pared" },
  "varsovia-pintura": { aspecto: ASPECTO_SALA, ancla: caja(0.5, 0.42, 0.56, 0.4), tipo: "pared" },
  "londres-pintura": { aspecto: ASPECTO_SALA, ancla: caja(0.5, 0.53, 0.66, 0.22), tipo: "pared" },
  "chicago-pintura": { aspecto: ASPECTO_SALA, ancla: caja(0.5, 0.5, 0.54, 0.42), tipo: "pared" },
  "rylands-lectura": { aspecto: ASPECTO_SALA, ancla: caja(0.5, 0.58, 0.46, 0.22), tipo: "atril" },
  gabinete: { aspecto: ASPECTO_SALA, ancla: caja(0.5, 0.36, 0.62, 0.42), tipo: "pared" },
};

const ESPACIOS_EPISODIO = espaciosJson as Record<string, EspacioEpisodio>;

const POR_DEFECTO: EspacioEpisodio = { sede: null, espacio: "gabinete", medio: "pintura" };

export function espacioDeEpisodio(episodioId: string): EspacioEpisodio {
  return ESPACIOS_EPISODIO[episodioId] ?? POR_DEFECTO;
}

export function episodiosConEspacio(): string[] {
  return Object.keys(ESPACIOS_EPISODIO);
}

/**
 * Máscara de presentación para obras fotografiadas sobre fondo negro (p. ej. un medallón de vidriera):
 * se muestra la obra completa y se oculta solo el fondo fotográfico. Coordenadas normalizadas medidas
 * sobre la imagen original (cx, cy respecto a ancho/alto; r respecto al ancho).
 */
export const MASCARAS_OBRA: Record<string, { cx: number; cy: number; r: number }> = {
  // The Prophet Isaiah (Met 32.24.48): medallón circular completo, con su aro de hierro.
  "is-01_o1": { cx: 0.4909, cy: 0.5035, r: 0.4405 },
  // El paraíso (Herri met de Bles, Rijksmuseum SK-A-780, en préstamo en el Bonnefanten): tondo completo, con su borde de madera.
  // El círculo envuelve toda la pintura (el tondo es ligeramente ovalado); solo se quita el fondo negro de la fotografía.
  "gn-01_o5": { cx: 0.5, cy: 0.5015, r: 0.5125 },
};

/**
 * Obras que la sala muestra enteras: la versión de portada (-detalle-960) es un recorte 16:9, y aquí hace falta el tondo.
 * ratio = ancho/alto de la imagen completa.
 */
export const OBRAS_COMPLETAS: Record<string, { ratio: number }> = {
  "gn-01_o5": { ratio: 960 / 999 },
};

export function obraCompleta(src: string): { src: string; ratio: number } | null {
  for (const [id, o] of Object.entries(OBRAS_COMPLETAS)) {
    if (src.includes(id) && src.includes("-detalle-960")) return { src: src.replace("-detalle-960", "-960"), ratio: o.ratio };
  }
  return null;
}

export function mascaraDeObra(src: string): { cx: number; cy: number; r: number } | null {
  for (const [id, m] of Object.entries(MASCARAS_OBRA)) if (src.includes(id)) return m;
  return null;
}

/** Grosor del marco/paspartú que rodea la obra, según el medio. */
export function grosorMarco(medio: MedioSala, ancho: number, alto: number): number {
  const lado = Math.min(ancho, alto);
  if (medio === "pintura") return Math.max(7, Math.round(lado * 0.05));
  if (medio === "estampa" || medio === "lamina") return Math.max(10, Math.round(lado * 0.08));
  return 0;
}

export type ComposicionSala = {
  /** Obra (sin marco). */
  obra: { width: number; height: number };
  marco: number;
  /** Imagen de la sala en coordenadas del escenario. */
  sala: { left: number; top: number; width: number; height: number };
  /** Encuadre inicial para «entrar» en la sala: toda la sala visible, centrada. */
  entrada: { scale: number; tx: number; ty: number };
};

/**
 * Coloca la obra entera (sin recortar) en el centro del escenario y escala la sala para que
 * su pared/ventana/atril rodee la obra y la imagen cubra todo el escenario.
 */
export function componerSala(opts: {
  espacio: Espacio;
  medio: MedioSala;
  ratio: number;
  stageW: number;
  stageH: number;
  centroY: number;
  maxAncho: number;
  maxAlto: number;
  maxEscalaSala?: number;
}): ComposicionSala {
  const { espacio, medio, stageW, stageH, centroY } = opts;
  const ratio = opts.ratio > 0 && Number.isFinite(opts.ratio) ? opts.ratio : 1;
  const { ancla, aspecto } = espacio;
  const ax = (ancla.x0 + ancla.x1) / 2;
  const ay = (ancla.y0 + ancla.y1) / 2;
  const aw = ancla.x1 - ancla.x0;
  const ah = ancla.y1 - ancla.y0;
  const holgura = espacio.tipo === "ventana" ? 0.985 : 0.9;

  const encajar = (maxW: number, maxH: number) => {
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    return { w, h };
  };

  // Tamaño ideal de la obra (con marco) en pantalla.
  let { w, h } = encajar(opts.maxAncho, opts.maxAlto);
  let m = grosorMarco(medio, w, h);
  let totalW = w + 2 * m;
  let totalH = h + 2 * m;

  // Escala necesaria de la sala para que el ancla contenga la obra.
  const anchoPorObra = Math.max(totalW / (aw * holgura), (totalH / (ah * holgura)) * aspecto);
  // Cobertura del escenario alrededor del ancla.
  const cubrirAncho = stageW / (2 * Math.max(0.05, Math.min(ax, 1 - ax)));
  const cubrirAlto = Math.max(centroY / Math.max(0.05, ay), (stageH - centroY) / Math.max(0.05, 1 - ay)) * aspecto;
  const limite = Math.max(cubrirAncho, cubrirAlto, stageW * (opts.maxEscalaSala ?? 1.9));

  let salaW = Math.max(anchoPorObra, cubrirAncho, cubrirAlto);
  if (salaW > limite) {
    salaW = limite;
    const cabe = encajar(aw * holgura * salaW, ah * holgura * (salaW / aspecto));
    // Restamos el marco proporcional para que obra+marco quepan.
    const k = Math.min(cabe.w / totalW, cabe.h / totalH);
    w *= k;
    h *= k;
    m = grosorMarco(medio, w, h);
    const k2 = Math.min((aw * holgura * salaW) / (w + 2 * m), (ah * holgura * (salaW / aspecto)) / (h + 2 * m), 1);
    w *= k2;
    h *= k2;
    totalW = w + 2 * m;
    totalH = h + 2 * m;
  }
  // En una ventana la vidriera llena el hueco: escalamos la sala para que el hueco abrace la obra.
  if (espacio.tipo === "ventana") {
    const ajuste = Math.max(totalW / (aw * holgura * salaW), (totalH * aspecto) / (ah * holgura * salaW));
    if (ajuste < 1) salaW = Math.max(salaW * ajuste, cubrirAncho, cubrirAlto);
  }
  const salaH = salaW / aspecto;
  const left = stageW / 2 - ax * salaW;
  const top = centroY - ay * salaH;

  // Encuadre inicial: la sala entera (cover) centrada en el escenario.
  const sEntrada = Math.min(1, Math.max(stageW / salaW, stageH / salaH));
  const cxSala = left + salaW / 2;
  const cySala = top + salaH / 2;
  const ox = stageW / 2;
  const oy = centroY;
  const tx = stageW / 2 - ox - sEntrada * (cxSala - ox);
  const ty = stageH / 2 - oy - sEntrada * (cySala - oy);

  return {
    obra: { width: Math.round(w), height: Math.round(h) },
    marco: m,
    sala: { left: Math.round(left), top: Math.round(top), width: Math.round(salaW), height: Math.round(salaH) },
    entrada: { scale: sEntrada, tx, ty },
  };
}

/** Atribuciones mostradas en Créditos para las imágenes de lugares. */
export const CREDITOS_LUGARES: { titulo: string; detalle: string; licencia: string }[] = [
  {
    titulo: "Tierra: NASA Blue Marble Next Generation (junio de 2004)",
    detalle: "NASA Earth Observatory / Visible Earth (Reto Stöckli, NASA GSFC)",
    licencia: "Dominio público (NASA)",
  },
  {
    titulo: "Ciudades vistas desde el satélite: Sentinel-2 cloudless 2016",
    detalle: "Sentinel-2 cloudless – https://s2maps.eu by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016)",
    licencia: "CC BY 4.0",
  },
  {
    titulo: "Vuelo en vivo desde el espacio: Google Photorealistic 3D Tiles",
    detalle: "Imágenes y datos © Google y sus proveedores, mostrados con las atribuciones durante el vuelo. Se cargan en directo; no se guardan. Visualización con CesiumJS (Apache 2.0). Globo de la Tierra visto desde lejos: NASA Blue Marble Next Generation, servido por NASA GIBS (sin clave)",
    licencia: "Map Tiles API (Google)",
  },
  { titulo: "Campo de estrellas y animación del viaje", detalle: "Render procedural propio de Audite", licencia: "Audite" },
  {
    titulo: "Salas: imágenes generadas para Audite",
    detalle: "Ambientaciones basadas en el estilo verificable de cada museo; no son fotografías de la sala concreta (salvo el interior del Bonnefantenmuseum, que es fotografía real; ver más abajo)",
    licencia: "Audite",
  },
];

export const CREDITOS_EDIFICIOS: { sede: SedeId; titulo: string; autor: string; licencia: string; url: string }[] = [
  { sede: "bonnefanten", titulo: "Rocket-shaped cupola of the Bonnefantenmuseum in Maastricht-Centrum (DSCF7938).jpg", autor: "Trougnouf (Benoit Brummer)", licencia: "CC BY 4.0", url: "https://commons.wikimedia.org/wiki/File:Rocket-shaped_cupola_of_the_Bonnefantenmuseum_in_Maastricht-Centrum_(DSCF7938).jpg" },
  { sede: "bonnefanten", titulo: "Central staircase at the Bonnefantenmuseum.jpg (interior)", autor: "Sebastiaan ter Burg", licencia: "CC BY 2.0", url: "https://commons.wikimedia.org/wiki/File:Central_staircase_at_the_Bonnefantenmuseum.jpg" },
  { sede: "rijksmuseum", titulo: "The Rijksmuseum, Amsterdam (53750007092).jpg", autor: "Mustang Joe", licencia: "CC0", url: "https://commons.wikimedia.org/wiki/File:The_Rijksmuseum,_Amsterdam_(53750007092).jpg" },
  { sede: "met", titulo: "MET entrance.jpg", autor: "Physicistjedi", licencia: "Dominio público", url: "https://commons.wikimedia.org/wiki/File:MET_entrance.jpg" },
  { sede: "cloisters", titulo: "The Cloisters Exterior.jpg", autor: "Beyond My Ken", licencia: "Dominio público", url: "https://commons.wikimedia.org/wiki/File:The_Cloisters_Exterior.jpg" },
  { sede: "getty", titulo: "A portion of the Getty Center in Los Angeles, California, one of two art museums that are part of the Getty Museum LCCN2013631549.tif", autor: "Carol M. Highsmith (Library of Congress)", licencia: "Dominio público", url: "https://commons.wikimedia.org/wiki/File:A_portion_of_the_Getty_Center_in_Los_Angeles,_California,_one_of_two_art_museums_that_are_part_of_the_Getty_Museum_LCCN2013631549.tif" },
  { sede: "nga", titulo: "National Gallery of Art (5945973341).jpg", autor: "Rob Young", licencia: "CC BY 2.0", url: "https://commons.wikimedia.org/wiki/File:National_Gallery_of_Art_(5945973341).jpg" },
  { sede: "cleveland", titulo: "Cleveland Art Museum, University Circle, Cleveland, OH (27787047587).jpg", autor: "Warren LeMay", licencia: "CC0", url: "https://commons.wikimedia.org/wiki/File:Cleveland_Art_Museum,_University_Circle,_Cleveland,_OH_(27787047587).jpg" },
  { sede: "berlin", titulo: "Gemäldegalerie am Kulturforum Berlin.JPG", autor: "Oursana", licencia: "CC0", url: "https://commons.wikimedia.org/wiki/File:Gem%C3%A4ldegalerie_am_Kulturforum_Berlin.JPG" },
  { sede: "varsovia", titulo: "2018 January 2018 in Warsaw.jpg", autor: "Rakoon", licencia: "CC0", url: "https://commons.wikimedia.org/wiki/File:2018_January_2018_in_Warsaw.jpg" },
  { sede: "londres", titulo: "2024--17 September--London Day 8--National Gallery, Trafalgar Square.jpg", autor: "Phil Venditti", licencia: "CC BY 2.0", url: "https://commons.wikimedia.org/wiki/File:2024--17_September--London_Day_8--National_Gallery,_Trafalgar_Square.jpg" },
  { sede: "chicago", titulo: "Art Institute of Chicago. (7847873314).jpg", autor: "Marlin Keesler", licencia: "CC BY 2.0", url: "https://commons.wikimedia.org/wiki/File:Art_Institute_of_Chicago._(7847873314).jpg" },
  { sede: "rylands", titulo: "John Rylands Library, Deansgate, Manchester (NHLE Code 1217800) (April 2024) (1).jpg", autor: "Hassocks5489", licencia: "CC0", url: "https://commons.wikimedia.org/wiki/File:John_Rylands_Library,_Deansgate,_Manchester_(NHLE_Code_1217800)_(April_2024)_(1).jpg" },
];
