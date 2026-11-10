import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function prepararGazpacho(opciones) {
  const base = opciones.base?.trim().replace(/\/$/, "");
  if (!base) return { estado: "reserva", aviso: "sin-url" };
  const archivos = [];
  for (const nombre of ["Gazpacho-Regular", "Gazpacho-Heavy"]) {
    let respuesta;
    try {
      respuesta = await opciones.fetch(`${base}/${nombre}.otf`);
    } catch {
      return { estado: "reserva", aviso: "descarga" };
    }
    if (!respuesta?.ok) return { estado: "reserva", aviso: "descarga" };
    let woff2;
    try {
      woff2 = Buffer.from(await opciones.compress(Buffer.from(await respuesta.arrayBuffer())));
    } catch {
      return { estado: "reserva", aviso: "woff2" };
    }
    archivos.push({ nombre: `${nombre}.woff2`, bytes: woff2 });
  }
  const css = `@font-face{font-family:"Gazpacho";src:url("/fonts/gazpacho/Gazpacho-Regular.woff2") format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:"Gazpacho";src:url("/fonts/gazpacho/Gazpacho-Heavy.woff2") format("woff2");font-weight:700;font-display:swap}
:root{--audite-font-display:"Gazpacho",Georgia,serif}`;
  await opciones.write(archivos, css);
  return { estado: "listo", aviso: "", css };
}

async function main() {
  const destino = path.resolve("apps/web/public/fonts/gazpacho");
  let compress = null;
  try {
    ({ compress } = await import("wawoff2"));
  } catch {
    console.warn("Gazpacho: no está el conversor woff2. Se usa Georgia.");
    return;
  }
  const resultado = await prepararGazpacho({
    base: process.env.GAZPACHO_FONTS_URL,
    fetch: (url) => fetch(url),
    compress,
    write: async (archivos, css) => {
      await mkdir(destino, { recursive: true });
      for (const archivo of archivos) await writeFile(path.join(destino, archivo.nombre), archivo.bytes);
      await writeFile(path.join(destino, "faces.css"), css);
    },
  });
  if (resultado.estado !== "listo") {
    console.warn(`Gazpacho: ${resultado.aviso}. Se usa Georgia y el build sigue.`);
    return;
  }
  console.log("Gazpacho: woff2 en el build, fuera de git.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
