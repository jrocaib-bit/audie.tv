import { robotsPara } from "@/lib/sitio-publico";

export function GET(request: Request) {
  const host = new URL(request.url).host;
  return new Response(robotsPara(host), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
