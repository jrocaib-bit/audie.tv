import type { Metadata } from "next";
import { ReferenciasPantalla } from "@/components/referencias-pantalla";

export const metadata: Metadata = { title: "Al margen" };

export default function Page() {
  return <ReferenciasPantalla />;
}
