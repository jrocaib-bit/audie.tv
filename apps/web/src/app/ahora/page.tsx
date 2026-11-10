import type { Metadata } from "next";
import { ReproductorV2 } from "@/components/v2/reproductor";

export const metadata: Metadata = { title: "Ahora" };

export default function Page() {
  return <ReproductorV2 />;
}
