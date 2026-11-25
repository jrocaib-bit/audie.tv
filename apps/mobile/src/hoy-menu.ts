/**
 * Menú contextual de Hoy: lo que se abre al mantener pulsada una tarjeta de «En curso» o el episodio de hoy,
 * y con el botón «…». Módulo puro: decide qué opciones salen según el tipo y el estado.
 *
 * Sin «Marcar como terminado»: el avance de un libro se une con el de la cuenta al abrir el lector,
 * y el de un reto o un episodio es lo escuchado de verdad. Darlo por terminado desde Hoy no encaja
 * con un progreso solo local.
 */

export type DestinoMenu = { tipo: "libro"; fijado: boolean } | { tipo: "reto"; fijado: boolean } | { tipo: "episodio" };

export type OpcionMenu = "fijar" | "desfijar" | "ir-libro" | "ir-reto" | "ver-camino" | "editar-hoy" | "quitar";

/** Opciones en el orden en que se pintan. «Quitar de Hoy» va la última, como acción que saca algo de la vista. */
export function opcionesMenu(destino: DestinoMenu): OpcionMenu[] {
  if (destino.tipo === "episodio") return ["ver-camino", "editar-hoy", "quitar"];
  return [destino.fijado ? "desfijar" : "fijar", destino.tipo === "libro" ? "ir-libro" : "ir-reto", "editar-hoy", "quitar"];
}
