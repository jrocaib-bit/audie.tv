import type { Metadata } from "next";
import { JuntosV2 } from "@/components/v2/juntos";

export const metadata: Metadata = { title: "Juntos" };

export default function Page() {
  return <JuntosV2 />;
}
