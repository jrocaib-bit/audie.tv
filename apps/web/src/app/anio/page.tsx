import type { Metadata } from "next";
import { AnioV2 } from "@/components/v2/anio";

export const metadata: Metadata = { title: "Tu año" };

export default function Page() {
  return <AnioV2 />;
}
