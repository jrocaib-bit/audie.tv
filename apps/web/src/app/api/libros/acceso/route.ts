import { resolverLector, respuesta } from "@/lib/libros/acceso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Vista del lector: sin-sesion, gratuito o premium. */
export async function GET(request: Request) {
  const lector = await resolverLector(request);
  return respuesta(200, { vista: lector.vista });
}
