import type { Metadata } from "next";
import { PathScreen } from "@/components/views";

export const metadata: Metadata = { title: "Camino" };

export default function Page() {
  return <PathScreen />;
}
