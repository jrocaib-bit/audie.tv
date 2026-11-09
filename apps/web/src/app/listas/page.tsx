import type { Metadata } from "next";
import { ListasV2 } from "@/components/v2/listas";

export const metadata: Metadata = { title: "Mis pasajes" };

export default function Page() {
  return <ListasV2 />;
}
