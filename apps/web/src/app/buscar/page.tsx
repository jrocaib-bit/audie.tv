import type { Metadata } from "next";
import { BuscarV2 } from "@/components/v2/buscar";

export const metadata: Metadata = { title: "Buscar" };

export default function Page() {
  return <BuscarV2 />;
}
