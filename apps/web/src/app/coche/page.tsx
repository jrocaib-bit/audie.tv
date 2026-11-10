import type { Metadata } from "next";
import { CocheV2 } from "@/components/v2/coche";

export const metadata: Metadata = { title: "Coche" };

export default function Page() {
  return <CocheV2 />;
}
