import type { Metadata } from "next";
import { NeoPath as PathScreen } from "@/components/neo-app";

export const metadata: Metadata = { title: "Camino" };

export default function Page() {
  return <PathScreen />;
}
