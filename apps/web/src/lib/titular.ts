export const NOMBRE_TITULAR = "Francisco Javier Roca Ibáñez";
export const CONTACTO_PRIVACIDAD = "soporte@audite.tv";

export function datoLegal(valor: string | undefined, hueco: "[NIF]" | "[DIRECCIÓN]"): string {
  const limpio = valor?.trim();
  return limpio ? limpio : hueco;
}

export function datosTitular(env?: { nif?: string; direccion?: string }): { nombre: string; nif: string; direccion: string; contacto: string } {
  const nif = env ? env.nif : process.env.LEGAL_TITULAR_NIF;
  const direccion = env ? env.direccion : process.env.LEGAL_TITULAR_DIRECCION;
  return {
    nombre: NOMBRE_TITULAR,
    nif: datoLegal(nif, "[NIF]"),
    direccion: datoLegal(direccion, "[DIRECCIÓN]"),
    contacto: CONTACTO_PRIVACIDAD,
  };
}
