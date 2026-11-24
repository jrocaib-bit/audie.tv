import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Subconjuntos latinos en el bucket privado `fuentes`. Nunca se versionan. */
export const FUENTES_GAZPACHO = [
  {
    ruta: "gazpacho/v1/Gazpacho-Regular.woff2",
    nombre: "Gazpacho-Regular.woff2",
    sha256: "b9d68b3265180b077cd3cd28fca1ace331de0c3c9289a203e494f7232f53ed62",
  },
  {
    ruta: "gazpacho/v1/Gazpacho-Heavy.woff2",
    nombre: "Gazpacho-Heavy.woff2",
    sha256: "a6c015a9f64eaf8227c53e7d170ad0557b45ff1044c587cf7d327056e611025f",
  },
];

export function cssGazpacho() {
  return `@font-face{font-family:"Gazpacho";src:url("/fonts/gazpacho/Gazpacho-Regular.woff2") format("woff2");font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:"Gazpacho";src:url("/fonts/gazpacho/Gazpacho-Heavy.woff2") format("woff2");font-weight:900;font-style:normal;font-display:swap}
`;
}

function urlAutenticada(base, ruta) {
  return `${base}/storage/v1/object/authenticated/fuentes/${ruta}`;
}

/** Descarga los dos woff2, comprueba el sha256 y los escribe. No registra la clave. */
export async function prepararFuentes(opciones) {
  const base = opciones.supabaseUrl?.trim().replace(/\/$/, "");
  const clave = opciones.serviceRole?.trim();
  if (!base || !clave) return { estado: "reserva", aviso: "sin-variables" };
  const archivos = [];
  for (const fuente of FUENTES_GAZPACHO) {
    let respuesta;
    try {
      respuesta = await opciones.fetch(urlAutenticada(base, fuente.ruta), {
        headers: { Authorization: `Bearer ${clave}`, apikey: clave },
      });
    } catch {
      return { estado: "reserva", aviso: "descarga" };
    }
    if (!respuesta?.ok) return { estado: "reserva", aviso: "descarga" };
    const bytes = Buffer.from(await respuesta.arrayBuffer());
    if (opciones.sha256(bytes) !== fuente.sha256) return { estado: "reserva", aviso: "sha256" };
    archivos.push({ nombre: fuente.nombre, bytes });
  }
  await opciones.write(archivos, cssGazpacho());
  return { estado: "listo", aviso: "" };
}

export async function main() {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const destino = path.join(raiz, "apps/web/public/fonts/gazpacho");
  const resultado = await prepararFuentes({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY,
    fetch: (url, init) => fetch(url, init),
    sha256: (bytes) => createHash("sha256").update(bytes).digest("hex"),
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
  console.log("Gazpacho: woff2 descargados del bucket privado y comprobados.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
