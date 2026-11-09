import path from "node:path";
import { fileURLToPath } from "node:url";
import { sincronizar } from "@audite/content/sync";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const destino = path.join(repo, "content/canon");
const argumento = process.argv.slice(2).find((arg) => !arg.startsWith("-"));
const conNombre = process.argv.find((arg) => arg.startsWith("--root=") || arg.startsWith("--archive="));
const entrada = conNombre?.slice(conNombre.indexOf("=") + 1) ?? argumento ?? "/workspace/audite";

if (path.resolve(destino).startsWith(path.resolve(repo, "content/demo"))) {
  console.log("El contenido real no se escribe en la demo.");
  process.exit(1);
}

const informe = sincronizar(entrada, destino);
if (!informe.ok && informe.errores.length > 0 && informe.copiados.length === 0) {
  for (const error of informe.errores) console.log(`- ${error.codigo}: ${error.mensaje}`);
  console.log("No se ha tocado la demo. El catálogo real queda como estaba si el origen no se pudo leer.");
  process.exit(1);
}
console.log(`Origen: ${informe.origen}`);
console.log(`Copiados: ${informe.copiados.length}`);
for (const archivo of informe.copiados) console.log(`  ok ${archivo}`);
console.log(`Faltan: ${informe.faltan.length}`);
for (const archivo of informe.faltan) console.log(`  falta ${archivo}`);
console.log(`Reproducibles: ${informe.reproducibles.join(", ") || "(ninguno)"}`);
process.exit(informe.ok ? 0 : 1);
