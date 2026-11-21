/** Ficheros (require) de «La sala» v2. Geometría, datos y créditos en sala-espacios.ts. */
import { ESPACIOS_GEOMETRIA, type Espacio, type EspacioId, type SedeId } from "./sala-espacios";

export * from "./sala-espacios";

export type ViajeSede = {
  video: number;
  inicio: number;
  final: number;
  edificio: number | null;
};

const IMAGENES_SALA: Record<EspacioId, number> = {
  "rijksmuseum-pintura": require("../assets/sala/salas/rijksmuseum-pintura.webp"),
  "met-pintura": require("../assets/sala/salas/met-pintura.webp"),
  "met-vitral": require("../assets/sala/salas/met-vitral.webp"),
  "met-medieval": require("../assets/sala/salas/met-medieval.webp"),
  "met-estampas": require("../assets/sala/salas/met-estampas.webp"),
  "cloisters-vitral": require("../assets/sala/salas/cloisters-vitral.webp"),
  "cloisters-vitral-cuadrado": require("../assets/sala/salas/cloisters-vitral-cuadrado.webp"),
  "cloisters-sala": require("../assets/sala/salas/cloisters-sala.webp"),
  "getty-pintura": require("../assets/sala/salas/getty-pintura.webp"),
  "nga-pintura": require("../assets/sala/salas/nga-pintura.webp"),
  "cleveland-pintura": require("../assets/sala/salas/cleveland-pintura.webp"),
  "berlin-pintura": require("../assets/sala/salas/berlin-pintura.webp"),
  "varsovia-pintura": require("../assets/sala/salas/varsovia-pintura.webp"),
  "londres-pintura": require("../assets/sala/salas/londres-pintura.webp"),
  "chicago-pintura": require("../assets/sala/salas/chicago-pintura.webp"),
  "rylands-lectura": require("../assets/sala/salas/rylands-lectura.webp"),
  "gabinete": require("../assets/sala/salas/gabinete.webp"),
};

export const ESPACIOS: Record<EspacioId, Espacio & { imagen: number }> = Object.fromEntries(
  (Object.keys(ESPACIOS_GEOMETRIA) as EspacioId[]).map((id) => [id, { ...ESPACIOS_GEOMETRIA[id], imagen: IMAGENES_SALA[id] }]),
) as Record<EspacioId, Espacio & { imagen: number }>;

export const VIAJES: Record<SedeId | "sin-lugar", ViajeSede> = {
  rijksmuseum: { video: require("../assets/sala/viaje/rijksmuseum.mp4"), inicio: require("../assets/sala/viaje/rijksmuseum-inicio.webp"), final: require("../assets/sala/viaje/rijksmuseum-final.webp"), edificio: require("../assets/sala/edificios/rijksmuseum.webp") },
  met: { video: require("../assets/sala/viaje/met.mp4"), inicio: require("../assets/sala/viaje/met-inicio.webp"), final: require("../assets/sala/viaje/met-final.webp"), edificio: require("../assets/sala/edificios/met.webp") },
  cloisters: { video: require("../assets/sala/viaje/cloisters.mp4"), inicio: require("../assets/sala/viaje/cloisters-inicio.webp"), final: require("../assets/sala/viaje/cloisters-final.webp"), edificio: require("../assets/sala/edificios/cloisters.webp") },
  getty: { video: require("../assets/sala/viaje/getty.mp4"), inicio: require("../assets/sala/viaje/getty-inicio.webp"), final: require("../assets/sala/viaje/getty-final.webp"), edificio: require("../assets/sala/edificios/getty.webp") },
  nga: { video: require("../assets/sala/viaje/nga.mp4"), inicio: require("../assets/sala/viaje/nga-inicio.webp"), final: require("../assets/sala/viaje/nga-final.webp"), edificio: require("../assets/sala/edificios/nga.webp") },
  cleveland: { video: require("../assets/sala/viaje/cleveland.mp4"), inicio: require("../assets/sala/viaje/cleveland-inicio.webp"), final: require("../assets/sala/viaje/cleveland-final.webp"), edificio: require("../assets/sala/edificios/cleveland.webp") },
  berlin: { video: require("../assets/sala/viaje/berlin.mp4"), inicio: require("../assets/sala/viaje/berlin-inicio.webp"), final: require("../assets/sala/viaje/berlin-final.webp"), edificio: require("../assets/sala/edificios/berlin.webp") },
  varsovia: { video: require("../assets/sala/viaje/varsovia.mp4"), inicio: require("../assets/sala/viaje/varsovia-inicio.webp"), final: require("../assets/sala/viaje/varsovia-final.webp"), edificio: require("../assets/sala/edificios/varsovia.webp") },
  londres: { video: require("../assets/sala/viaje/londres.mp4"), inicio: require("../assets/sala/viaje/londres-inicio.webp"), final: require("../assets/sala/viaje/londres-final.webp"), edificio: require("../assets/sala/edificios/londres.webp") },
  chicago: { video: require("../assets/sala/viaje/chicago.mp4"), inicio: require("../assets/sala/viaje/chicago-inicio.webp"), final: require("../assets/sala/viaje/chicago-final.webp"), edificio: require("../assets/sala/edificios/chicago.webp") },
  rylands: { video: require("../assets/sala/viaje/rylands.mp4"), inicio: require("../assets/sala/viaje/rylands-inicio.webp"), final: require("../assets/sala/viaje/rylands-final.webp"), edificio: require("../assets/sala/edificios/rylands.webp") },
  "sin-lugar": { video: require("../assets/sala/viaje/sin-lugar.mp4"), inicio: require("../assets/sala/viaje/sin-lugar-inicio.webp"), final: require("../assets/sala/viaje/sin-lugar-final.webp"), edificio: null },
};

