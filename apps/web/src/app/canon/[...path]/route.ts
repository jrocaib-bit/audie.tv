import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PERMITIDOS = ["02_guiones/", "03_identidad/logos/", "04_arte/", "05_audio/"];

function repoRoot(): string {
  let dir = process.cwd();
  for (let depth = 0; depth < 6; depth += 1) {
    if (existsSync(path.join(dir, "content/canon/01_canon/manifiesto.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("No está la carpeta content/canon.");
}

function tipo(archivo: string): string {
  if (archivo.endsWith(".mp3")) return "audio/mpeg";
  if (archivo.endsWith(".jpg") || archivo.endsWith(".jpeg")) return "image/jpeg";
  if (archivo.endsWith(".png")) return "image/png";
  if (archivo.endsWith(".svg")) return "image/svg+xml";
  if (archivo.endsWith(".vtt")) return "text/vtt; charset=utf-8";
  return "application/octet-stream";
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await context.params;
  const relativa = parts.join("/");
  const extensionOk = /\.(mp3|jpe?g|png|svg|vtt)$/i.test(relativa);
  if (!extensionOk || !PERMITIDOS.some((prefijo) => relativa.startsWith(prefijo)) || relativa.includes("..")) {
    return new Response("Not found", { status: 404 });
  }
  const full = path.resolve(repoRoot(), "content/canon", relativa);
  const raiz = path.resolve(repoRoot(), "content/canon");
  if (!full.startsWith(`${raiz}${path.sep}`) || !existsSync(full)) return new Response("Not found", { status: 404 });
  const info = await stat(full);
  const mime = tipo(full);
  const range = request.headers.get("range");
  if (range && mime === "audio/mpeg") {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    if (!match) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : info.size - 1;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end >= info.size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    }
    return new Response(Readable.toWeb(createReadStream(full, { start, end })) as ReadableStream, {
      status: 206,
      headers: {
        "Content-Type": mime,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${info.size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
      },
    });
  }
  return new Response(Readable.toWeb(createReadStream(full)) as ReadableStream, {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(info.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
