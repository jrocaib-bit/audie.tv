import manifest from "../../../content/catalog/manifest.json";
import type { Catalog } from "@audite/domain";
import { manifestSchema } from "./schema";

export function loadCatalog(): Catalog {
  return manifestSchema.parse(manifest);
}
