import { manejadoresLista } from "@/lib/libros/anotaciones-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST, DELETE } = manejadoresLista("notas");
