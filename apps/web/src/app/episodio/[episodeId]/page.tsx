import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ episodeId: string }> }) {
  const { episodeId } = await params;
  if (episodeId === "es-genesis-01" || episodeId === "gn-01") redirect("/es/catalogo/gn-01");
  redirect("/biblioteca");
}
