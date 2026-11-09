import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { loadCatalog } from "@audite/content/catalog";
import { resolvePilotFile } from "@audite/content/media";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function repoRoot(): string {
  let dir = process.cwd();
  for (let depth = 0; depth < 6; depth += 1) {
    if (existsSync(path.join(dir, "content/pilot/audio"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Audite pilot content was not found.");
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await context.params;
  const publicPath = `/media/${parts.map((part) => part.replaceAll("\\", "")).join("/")}`;
  const file = resolvePilotFile(repoRoot(), publicPath, loadCatalog());
  if (!file || !existsSync(file.full)) return new Response("Not found", { status: 404 });

  const info = await stat(file.full);
  const range = request.headers.get("range");
  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    if (!match) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : info.size - 1;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end >= info.size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    }
    const stream = createReadStream(file.full, { start, end });
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: {
        "Content-Type": file.type,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${info.size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  const stream = createReadStream(file.full);
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": file.type,
      "Content-Length": String(info.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
