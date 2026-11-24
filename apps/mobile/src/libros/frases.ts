/** Parte un texto en frases para que cada una se pueda tocar y subrayar. Conserva todos los caracteres. */
export function partirEnFrases(texto: string): { texto: string; inicio: number }[] {
  const trozos = texto.match(/[^.!?…]+[.!?…]+["”»)]*\s*|[^.!?…]+$/g) ?? [texto];
  let inicio = 0;
  return trozos.map((parte) => {
    const salida = { texto: parte, inicio };
    inicio += parte.length;
    return salida;
  });
}
