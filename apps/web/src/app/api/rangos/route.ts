import { leerRangos } from "@audite/content/app-catalog";

export function GET() {
  return Response.json({ rangos: leerRangos() }, { headers: { "Cache-Control": "public, max-age=300" } });
}
