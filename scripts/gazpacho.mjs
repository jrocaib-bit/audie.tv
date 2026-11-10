import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.GAZPACHO_FONTS_URL?.trim().replace(/\/$/, "");
const destino = path.resolve("apps/web/public/fonts/gazpacho");
if (!base) {
  console.log("Gazpacho: sin GAZPACHO_FONTS_URL, se usa Georgia.");
  process.exit(0);
}

await mkdir(destino, { recursive: true });
for (const nombre of ["Gazpacho-Regular", "Gazpacho-Heavy"]) {
  const respuesta = await fetch(`${base}/${nombre}.otf`);
  if (!respuesta.ok) throw new Error(`fuente ${nombre}`);
  await writeFile(path.join(destino, `${nombre}.otf`), Buffer.from(await respuesta.arrayBuffer()));
}
const css = `@font-face{font-family:"Gazpacho";src:url("/fonts/gazpacho/Gazpacho-Regular.otf") format("opentype");font-weight:400;font-display:swap}
@font-face{font-family:"Gazpacho";src:url("/fonts/gazpacho/Gazpacho-Heavy.otf") format("opentype");font-weight:700;font-display:swap}
:root{--audite-font-display:"Gazpacho",Georgia,serif}`;
await writeFile(path.join(destino, "faces.css"), css);
console.log("Gazpacho: listo en el build, fuera de git.");
