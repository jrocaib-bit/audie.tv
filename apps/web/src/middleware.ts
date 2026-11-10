import { idiomaResuelto, etiquetasDeCabecera } from "@audite/domain";
import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") return NextResponse.next();
  const guardado = request.cookies.get("audite.idioma")?.value;
  const idioma = idiomaResuelto(guardado, etiquetasDeCabecera(request.headers.get("accept-language")));
  const url = request.nextUrl.clone();
  url.pathname = `/${idioma}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: "/" };
