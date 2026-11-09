const CACHE = "audite-pilot-v1";
const MEDIA = [];

function parseByteRange(header, total) {
  if (!header) return "full";
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || total <= 0) return "unsatisfiable";
  const startRaw = match[1] || "";
  const endRaw = match[2] || "";
  let start;
  let end;
  if (startRaw === "" && endRaw !== "") {
    const suffix = Number(endRaw);
    if (!Number.isFinite(suffix) || suffix <= 0) return "unsatisfiable";
    start = Math.max(0, total - suffix);
    end = total - 1;
  } else {
    start = Number(startRaw);
    end = endRaw === "" ? total - 1 : Number(endRaw);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= total || end < start) return "unsatisfiable";
  return { start, end: Math.min(end, total - 1) };
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(MEDIA)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (!MEDIA.includes(url.pathname) || event.request.method !== "GET") return;
  event.respondWith(serve(event.request, url.pathname));
});

async function serve(request, pathname) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(pathname);
  const range = parseByteRange(request.headers.get("range"), cached ? Number(cached.headers.get("content-length")) : 0);
  if (cached && range !== "unsatisfiable") {
    if (range === "full") return cached;
    const buffer = await cached.arrayBuffer();
    const slice = buffer.slice(range.start, range.end + 1);
    return new Response(slice, {
      status: 206,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(slice.byteLength),
        "Content-Range": `bytes ${range.start}-${range.end}/${buffer.byteLength}`,
        "Accept-Ranges": "bytes",
      },
    });
  }
  const response = await fetch(request);
  if (response.ok && response.status === 200) {
    await cache.put(pathname, response.clone());
  }
  return response;
}
