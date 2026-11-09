import type { Metadata } from "next";
import { DescargasPantalla } from "@/components/descargas-pantalla";

export const metadata: Metadata = { title: "Descargas" };

export default function Page() {
  return <DescargasPantalla />;
}
