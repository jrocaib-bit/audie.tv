import type { Metadata } from "next";
import { BibliotecaV2 } from "@/components/v2/biblioteca";

export const metadata: Metadata = { title: "Biblioteca" };

export default function Page() {
  return <BibliotecaV2 />;
}
