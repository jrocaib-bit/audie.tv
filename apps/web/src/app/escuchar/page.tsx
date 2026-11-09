import { Suspense } from "react";
import type { Metadata } from "next";
import { InicioV2 } from "@/components/v2/inicio";

export const metadata: Metadata = { title: "Inicio" };

export default function Page() {
  return (
    <Suspense>
      <InicioV2 />
    </Suspense>
  );
}
