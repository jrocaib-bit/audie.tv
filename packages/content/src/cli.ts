import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPublicCatalog } from "./build-catalog";
import { validateRepository } from "./validate";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const writeCatalog = process.argv.includes("--write-catalog");

if (writeCatalog) {
  const catalog = buildPublicCatalog(root);
  const target = path.join(root, "content/catalog/manifest.json");
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(catalog, null, 2)}\n`);
  process.stdout.write(`wrote ${path.relative(root, target)}\n`);
}

const report = validateRepository(root);
const errors = report.issues.filter((item) => item.severity === "error");
const warnings = report.issues.filter((item) => item.severity === "warning");
process.stdout.write(`Audite catalog validation\nok: ${report.ok}\nerrors: ${errors.length}\nwarnings: ${warnings.length}\n`);
for (const item of report.issues) {
  process.stdout.write(`- ${item.severity} ${item.code}: ${item.message}\n`);
}
process.exit(report.ok ? 0 : 1);
