import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { bajaLista } from "@/lib/formularios/acciones";

async function darDeBaja(token: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (token) await bajaLista(token);
  if (!url || !anon || !token) return;
  const cliente = createClient(url, anon, { auth: { persistSession: false } });
  await cliente.rpc("unsubscribe_by_token", { t: token });
}

function pagina(): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Baja</title></head><body style="background:#100E0C;color:#F4ECE2;font-family:Georgia,serif;padding:48px"><h1>Listo</h1><p>Ya no recibirás correos de este tipo.</p><p><a style="color:#C9A96E" href="https://audite.tv">Audite</a></p></body></html>`;
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  await darDeBaja(token);
  return new NextResponse(pagina(), { headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  await darDeBaja(token);
  return new NextResponse(null, { status: 200 });
}
