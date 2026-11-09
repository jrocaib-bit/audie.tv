import type { Metadata } from "next";
import { AvisosPantalla } from "@/components/avisos-pantalla";

export const metadata: Metadata = { title: "Avisos" };

export default function Page() {
  return <AvisosPantalla />;
}
