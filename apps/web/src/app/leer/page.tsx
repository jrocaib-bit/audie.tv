import type { Metadata } from "next";
import { LecturaPantalla } from "@/components/lectura-pantalla";

export const metadata: Metadata = { title: "Lectura" };

export default function Page() {
  return <LecturaPantalla />;
}
