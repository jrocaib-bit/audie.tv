import { writeFileSync } from "node:fs";
import type { Reto } from "../packages/domain/src/liturgia.ts";
import { programaCsv, programaEntre } from "../packages/domain/src/programa.ts";
import retosJson from "../content/tiempos/retos.json";

function argumento(nombre: string): string | null {
  const indice = process.argv.indexOf(nombre);
  return indice >= 0 ? process.argv[indice + 1] ?? null : null;
}

const desde = argumento("--desde");
const hasta = argumento("--hasta");
if (!desde || !hasta || !/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta) || desde > hasta) {
  console.error("Uso: pnpm calendario:export --desde 2026-11-29 --hasta 2027-11-27");
  process.exit(1);
}

const filas = programaEntre(desde, hasta, (retosJson as { retos: Reto[] }).retos);
const csv = programaCsv(filas);
const destino = argumento("--salida");
if (destino) writeFileSync(destino, `${csv}\n`);
else process.stdout.write(`${csv}\n`);
