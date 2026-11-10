import type { Metadata } from "next";
import { ListasV2 } from "@/components/v2/listas";

export const metadata: Metadata = { title: "Lista" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListasV2 id={id} />;
}