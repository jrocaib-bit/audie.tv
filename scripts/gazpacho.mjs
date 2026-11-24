import { pathToFileURL } from "node:url";
import { main } from "./fetch-fonts.mjs";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
