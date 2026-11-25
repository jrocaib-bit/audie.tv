/**
 * Captura de REVISIÓN INTERNA del vuelo de «La sala» (Google Photorealistic 3D Tiles + CesiumJS).
 *
 * - Usa el MISMO HTML que la WebView (apps/mobile/src/sala-vuelo-html.ts), servido desde memoria.
 * - Lee la clave SOLO de process.env.GOOGLE_MAPS_API_KEY; nunca se escribe en disco ni se registra.
 *   La clave se inyecta con evaluateOnNewDocument. El registro de peticiones guarda solo host + path (sin query).
 * - Un solo proceso de Chrome y una sola sesión (root.json) durante toda la captura: el proceso queda
 *   como servicio local (127.0.0.1) y recibe órdenes: /foto, /video, /fin.
 * - Las teselas son de Google: el vídeo y los fotogramas son SOLO revisión interna. No van a la app ni al repo.
 *
 * Uso:
 *   PUPPETEER_CORE_PATH=/ruta/a/node_modules/puppeteer-core GOOGLE_MAPS_API_KEY=... \
 *     npx tsx scripts/captura-vuelo-google3d.ts serve --sede=bonnefanten --log=/ruta/peticiones.log
 *   curl -s -X POST localhost:9444/foto -d '{"t":9000,"out":"/tmp/x.png"}'
 *   curl -s -X POST localhost:9444/video -d '{"dir":"/tmp/fotogramas"}'
 *   curl -s -X POST localhost:9444/fin
 */
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { HTML_VUELO } from "../apps/mobile/src/sala-vuelo-html";
import { planDeVuelo, scriptInyeccionVuelo } from "../apps/mobile/src/sala-vuelo";
import type { SedeId } from "../apps/mobile/src/sala-espacios";

const arg = (n: string, def = "") => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? def;
const clave = process.argv.includes("--simulado") ? "clave-simulada" : process.env.GOOGLE_MAPS_API_KEY ?? "";
if (!clave) {
  console.error("Falta GOOGLE_MAPS_API_KEY en el entorno.");
  process.exit(1);
}
const sede = (arg("sede", "bonnefanten") as SedeId);
const registro = arg("log", "/tmp/peticiones-vuelo.log");
const puerto = Number(arg("puerto", "9444"));
const ancho = 1080;
const alto = 1920;
const FPS = Number(arg("fps", "30")) || 30;

const require = createRequire(import.meta.url);
const puppeteer = require(path.join(process.env.PUPPETEER_CORE_PATH ?? "puppeteer-core"));

const simulado = process.argv.includes("--simulado");
const CORS = { "access-control-allow-origin": "*" };
const REGION = [-3.14, -1.57, 3.14, 1.57, 0, 100];
// Tileset vacío con la misma forma que root.json de Google (hijo con tileset externo): prueba el flujo sin gastar sesión.
const RAIZ_SIMULADA = JSON.stringify({ asset: { version: "1.0" }, geometricError: 1e6, root: { boundingVolume: { region: REGION }, geometricError: 5e5, refine: "REPLACE", children: [{ boundingVolume: { region: REGION }, geometricError: 5e5, content: { uri: "/v1/3dtiles/datasets/X/files/ext.json?session=simulada" } }] } });
const EXT_SIMULADO = JSON.stringify({ asset: { version: "1.0" }, geometricError: 1e5, root: { boundingVolume: { region: REGION }, geometricError: 1e5, refine: "REPLACE", children: [] } });

const ORIGEN = "https://sala.audite.invalid/vuelo.html";
let rootJson = 0;
let total = 0;
function anotar(url: string) {
  // Solo host + path: la query lleva la clave y la sesión.
  const u = new URL(url);
  total++;
  if (u.hostname === "tile.googleapis.com" && u.pathname.endsWith("/root.json")) rootJson++;
  if (u.hostname.endsWith("googleapis.com") && total % 50 !== 1 && !u.pathname.endsWith("root.json")) return;
  appendFileSync(registro, `${new Date().toISOString()} ${u.hostname}${u.pathname}\n`);
}

const plan = planDeVuelo(sede, { captura: true, margenInferior: 0 });
if (plan && process.argv.includes("--depuracion")) plan.depuracion = true;
if (plan && arg("escala")) plan.escala = Number(arg("escala"));
if (!plan) throw new Error(`Sede sin coordenadas: ${sede}`);

const navegador = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  userDataDir: `/tmp/chrome-vuelo-${process.pid}`,
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--hide-scrollbars",
    `--window-size=${ancho},${alto}`,
  ],
  protocolTimeout: 1_800_000,
  defaultViewport: { width: ancho, height: alto, deviceScaleFactor: 1 },
});
const pagina = await navegador.newPage();
await pagina.setRequestInterception(true);
pagina.on("request", (r: any) => {
  const url = r.url();
  if (url === ORIGEN) return r.respond({ status: 200, contentType: "text/html; charset=utf-8", body: HTML_VUELO });
  anotar(url);
  if (simulado && new URL(url).hostname === "tile.googleapis.com") {
    const cuerpo = new URL(url).pathname.endsWith("/root.json") ? RAIZ_SIMULADA : EXT_SIMULADO;
    return r.respond({ status: 200, contentType: "application/json", headers: CORS, body: cuerpo });
  }
  return r.continue();
});
pagina.on("console", (m: any) => {
  const t = String(m.text()).replace(/key=[^&"' ]*/gi, "key=REDACTED").slice(0, 200);
  appendFileSync(registro, `consola: ${t}\n`);
});
pagina.on("pageerror", (e: any) => appendFileSync(registro, `error: ${String(e.message).replace(/key=[^&"' ]*/gi, "key=REDACTED").slice(0, 200)}\n`));
// Sustituto de ReactNativeWebView: los avisos de la página (sin clave) van al registro.
await pagina.evaluateOnNewDocument("window.ReactNativeWebView={postMessage:function(m){console.log('aviso '+m)}}");
await pagina.evaluateOnNewDocument(scriptInyeccionVuelo(clave, plan));
await pagina.goto(ORIGEN, { waitUntil: "load", timeout: 60000 });
await pagina.waitForFunction("window.__vuelo", { timeout: 120000 });
appendFileSync(registro, `# listo; root.json hasta ahora: ${rootJson}\n`);

type Orden = { escala?: number; detalleFinal?: number; t?: number; out?: string; keyframes?: unknown; suelo?: number; duracion?: number; dir?: string; desde?: number; hasta?: number };

const anota = (m: string) => appendFileSync(registro, `# ${new Date().toISOString()} ${m}\n`);

async function capturar(destino: string, metodo = "puppeteer") {
  const png = destino.endsWith(".png");
  const t0 = Date.now();
  if (metodo === "cdp") {
    const cdp = await pagina.createCDPSession();
    const r = await cdp.send("Page.captureScreenshot", { format: png ? "png" : "jpeg", quality: 92, fromSurface: false });
    writeFileSync(destino, Buffer.from(r.data, "base64"));
    await cdp.detach();
  } else {
    await pagina.screenshot({ path: destino, type: png ? "png" : "jpeg", ...(png ? {} : { quality: 92 }) });
  }
  return Date.now() - t0;
}

async function foto(o: Orden & { metodo?: string }) {
  if (o.keyframes) await pagina.evaluate((k: unknown, s: number | undefined, d: number | undefined) => (window as any).__vuelo.ponerKeyframes(k, s, d), o.keyframes, o.suelo, o.duracion);
  const r = await pagina.evaluate((t: number) => (window as any).__vuelo.pintar(t, 90000), o.t ?? 0);
  anota(`pintado t=${o.t} ${JSON.stringify(r)}`);
  const msFoto = await capturar(o.out!, o.metodo);
  anota(`captura ${msFoto} ms`);
  return { ...r, msFoto };
}

async function video(o: Orden) {
  if (o.keyframes) await pagina.evaluate((k: unknown, s: number | undefined, d: number | undefined) => (window as any).__vuelo.ponerKeyframes(k, s, d), o.keyframes, o.suelo, o.duracion);
  mkdirSync(o.dir!, { recursive: true });
  const dur: number = await pagina.evaluate(() => (window as any).__vuelo.duracion);
  const n = Math.round((dur / 1000) * FPS);
  const sinCargar: number[] = [];
  for (let i = o.desde ?? 0; i <= (o.hasta ?? n); i++) {
    const r = await pagina.evaluate((t: number) => (window as any).__vuelo.pintar(t, 8000), (i / n) * dur);
    if (!r.cargado) sinCargar.push(i);
    await capturar(path.join(o.dir!, `f${String(i).padStart(4, "0")}.jpg`));
    if (i % 20 === 0) anota(`fotograma ${i}/${n}`);
  }
  return { fotogramas: n + 1, sinCargar: sinCargar.length };
}

const servidor = http.createServer((req, res) => {
  let cuerpo = "";
  req.on("data", (c) => (cuerpo += c));
  req.on("end", async () => {
    try {
      const o: Orden = cuerpo ? JSON.parse(cuerpo) : {};
      let r: unknown = { ok: true };
      if (req.url === "/foto") r = await foto(o);
      else if (req.url === "/video") r = await video(o);
      else if (req.url === "/estado") r = { rootJson, peticiones: total };
      else if (req.url === "/ajustar") r = await pagina.evaluate((a: unknown) => ((window as any).__vuelo.ajustar(a), a), o);
      else if (req.url === "/diagnostico") {
        // Solo cifras de rendimiento (nunca URLs ni la clave).
        r = await pagina.evaluate(() => {
          const v = (window as any).__vuelo;
          return v && v.diagnostico ? v.diagnostico() : null;
        });
      }
      else if (req.url === "/fin") {
        res.end(JSON.stringify({ rootJson, peticiones: total }));
        appendFileSync(registro, `# fin; root.json: ${rootJson}; peticiones: ${total}\n`);
        await navegador.close();
        servidor.close();
        process.exit(0);
      }
      res.end(JSON.stringify({ ...(r as object), rootJson }));
    } catch (e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: String((e as Error).message).replace(/key=[^&"' ]*/gi, "key=REDACTED").slice(0, 300) }));
    }
  });
});
servidor.listen(puerto, "127.0.0.1", () => writeFileSync(registro + ".listo", String(rootJson)));
