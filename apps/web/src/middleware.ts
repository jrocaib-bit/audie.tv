import { idiomaResuelto, etiquetasDeCabecera } from "@audite/domain";
import { NextResponse, type NextRequest } from "next/server";

const IDIOMAS = new Set(["es", "en", "it", "pt", "fr", "de", "zh"]);

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const guardado = request.cookies.get("audite.idioma")?.value;
    const idioma = idiomaResuelto(guardado, etiquetasDeCabecera(request.headers.get("accept-language")));
    const url = request.nextUrl.clone();
    url.pathname = `/${idioma}`;
    return NextResponse.redirect(url);
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-audite-path", request.nextUrl.pathname);
  const segmento = request.nextUrl.pathname.split("/")[1] ?? "";
  if (IDIOMAS.has(segmento)) requestHeaders.set("x-audite-lang", segmento);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"] };
