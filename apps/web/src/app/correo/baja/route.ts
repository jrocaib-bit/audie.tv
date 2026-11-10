import { NextResponse } from "next/server";
import { bajaLista } from "@/lib/formularios/acciones";
import { BOTON_BAJA, MENSAJE_BAJA_ERROR, MENSAJE_BAJA_INVALIDA, MENSAJE_BAJA_OK, vistaCorreo } from "@/lib/formularios/logica";

function pagina(titulo: string, cuerpo: string, estado = 200): NextResponse {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${titulo}</title></head><body style="background:#100E0C;color:#F4ECE2;font-family:Georgia,serif;padding:48px"><h1>${titulo}</h1>${cuerpo}<p><a style="color:#C9A96E" href="https://audite.tv">Audite</a></p></body></html>`;
  return new NextResponse(html, { status: estado, headers: { "content-type": "text/html; charset=utf-8" } });
}

function formulario(token: string): string {
  return `<form method="post" action="/correo/baja?t=${encodeURIComponent(token)}"><button type="submit">${BOTON_BAJA}</button></form>`;
}

export async function GET(request: Request) {
  if (vistaCorreo("GET") === "ejecutar") return pagina("Baja", formulario(""), 500);
  const token = new URL(request.url).searchParams.get("t") ?? "";
  return pagina("Baja", `<p>Pulsa para dejar de recibir estos correos.</p>${formulario(token)}`);
}

export async function POST(request: Request) {
  if (vistaCorreo("POST") !== "ejecutar") return pagina("Baja", MENSAJE_BAJA_ERROR, 405);
  const url = new URL(request.url);
  const cuerpo = await request.text().catch(() => "");
  const token = url.searchParams.get("t") ?? new URLSearchParams(cuerpo).get("t") ?? "";
  const resultado = await bajaLista(token);
  const oneClick = cuerpo.includes("List-Unsubscribe=One-Click");
  if (resultado === "ok") {
    return oneClick ? new NextResponse(null, { status: 200 }) : pagina("Listo", `<p>${MENSAJE_BAJA_OK}</p>`);
  }
  const texto = resultado === "error" ? MENSAJE_BAJA_ERROR : MENSAJE_BAJA_INVALIDA;
  return pagina(resultado === "error" ? "Error" : "Enlace no válido", `<p>${texto}</p>`, resultado === "error" ? 500 : 400);
}
