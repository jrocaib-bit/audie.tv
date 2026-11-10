import { Suspense } from "react";
import type { Metadata } from "next";
import { InicioV2 } from "@/components/v2/inicio";
import { Esqueleto } from "@/components/v2/esqueleto";

export const metadata: Metadata = { title: "Inicio" };

export default function Page() {
  return (
    <Suspense fallback={<Esqueleto />}>
      <InicioV2 />
    </Suspense>
  );
}
