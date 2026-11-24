/** Esquema estricto del fichero privado de texto. Rechaza claves de más. */
import { ID_TEXTO, type TextoEpisodio } from "@audite/domain";
import { z } from "zod";

export const IDIOMAS_TEXTO = ["es", "en"] as const;
export type IdiomaTexto = (typeof IDIOMAS_TEXTO)[number];

const versiculo = z
  .object({
    ref: z.string().min(1).max(24),
    cap: z.number().int().positive().max(200),
    v: z.string().regex(/^\d{1,3}[a-z]?(-\d{1,3})?$/),
    texto: z.string().min(1).max(4000),
    t: z.number().finite().nonnegative().optional(),
  })
  .strict();

export const esquemaTexto = z
  .object({
    version: z.literal(1),
    episodio: z.string().regex(ID_TEXTO),
    idioma: z.enum(IDIOMAS_TEXTO),
    muestra: z.boolean(),
    fuente: z.string().min(1).max(200),
    credito: z.string().min(1).max(1000),
    versiculos: z.array(versiculo).min(1).max(2000),
  })
  .strict();

/** Valida y comprueba que el fichero corresponde al episodio y al idioma pedidos. */
export function validarTexto(valor: unknown, episodio: string, idioma: IdiomaTexto): TextoEpisodio | null {
  const resultado = esquemaTexto.safeParse(valor);
  if (!resultado.success) return null;
  if (resultado.data.episodio !== episodio || resultado.data.idioma !== idioma) return null;
  return resultado.data;
}
