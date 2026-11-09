import type { Metadata } from "next";
import { NotasPantalla } from "@/components/notas-pantalla";

export const metadata: Metadata = { title: "Notas" };

export default function Page() {
  return <NotasPantalla />;
}
