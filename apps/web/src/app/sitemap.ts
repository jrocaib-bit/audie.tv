import type { MetadataRoute } from "next";
import { entradasSitemap } from "@/lib/sitio-publico";

export default function sitemap(): MetadataRoute.Sitemap {
  return entradasSitemap().map((url) => ({ url }));
}
