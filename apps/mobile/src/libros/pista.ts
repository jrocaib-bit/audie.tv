/** Pista de primera visita de la estantería. Se muestra hasta el primer toque y queda recordada. Sin React. */
import type { AlmacenClaves } from "./cache-swr";

export const CLAVE_PISTA = "audite.libros.pista.v1";
export const TEXTO_PISTA = "Toca un libro para abrirlo";

export async function pistaVista(almacen: AlmacenClaves): Promise<boolean> {
  try {
    return (await almacen.getItem(CLAVE_PISTA)) === "1";
  } catch {
    return false;
  }
}

export async function recordarPista(almacen: AlmacenClaves): Promise<void> {
  try {
    await almacen.setItem(CLAVE_PISTA, "1");
  } catch {
    // Sin almacenamiento: la pista vuelve a salir en la próxima visita.
  }
}

/** Hay que mostrar la pista si hay lomos que tocar y el lector no ha tocado ninguno nunca. */
export function mostrarPista(vista: boolean | null, hayLomos: boolean): boolean {
  return vista === false && hayLomos;
}

/** Vaivén suave de un lomo, en píxeles. Con movimiento reducido no hay vaivén. */
export function vaiven(reducido: boolean): number[] {
  return reducido ? [0] : [0, -10, 0, -6, 0];
}
