import type { Metadata } from "next";
import { Privacidad } from "@/components/privacidad";

export const metadata: Metadata = { title: "Privacidad" };

export default function Page() {
  return <Privacidad />;
}
