import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Esqueleto } from "@/components/v2/esqueleto";
import { RetoV2 } from "@/components/v2/reto";
import { RETOS } from "@/lib/retos";

export function generateStaticParams() {
  return RETOS.map((reto) => ({ id: reto.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reto = RETOS.find((item) => item.id === id);
  if (!reto) notFound();
  return (
    <Suspense fallback={<Esqueleto />}>
      <RetoV2 reto={reto} />
    </Suspense>
  );
}
