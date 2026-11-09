import path from "node:path";
import type { Catalog } from "@audite/domain";

const KIT_FILE = /^content\/pilot\/(audio|assets)\/[A-Za-z0-9._-]+$/;

export function resolvePilotFile(
  repoRoot: string,
  publicPath: string,
  catalog: Catalog,
): { full: string; type: string } | null {
  const segment = catalog.episodes.flatMap((episode) => episode.segments).find((item) => item.publicPath === publicPath);
  const artwork = catalog.artworks.find((item) => item.publicPath === publicPath);
  const kitPath = segment?.kitPath ?? artwork?.kitPath;
  if (!kitPath || kitPath.includes("..") || path.isAbsolute(kitPath) || !KIT_FILE.test(kitPath)) return null;
  const full = path.resolve(repoRoot, kitPath);
  const pilotRoot = path.resolve(repoRoot, "content/pilot");
  if (full !== path.join(pilotRoot, path.relative(pilotRoot, full)) || !full.startsWith(pilotRoot + path.sep)) {
    return null;
  }
  const type = kitPath.endsWith(".mp3") ? "audio/mpeg" : kitPath.endsWith(".jpg") ? "image/jpeg" : null;
  if (!type) return null;
  return { full, type };
}
