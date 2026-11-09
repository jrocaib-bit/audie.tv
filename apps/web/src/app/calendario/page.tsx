import { Suspense } from "react";
import { CalendarioV2 } from "@/components/v2/calendario";
import { Esqueleto } from "@/components/v2/esqueleto";

export const metadata = { title: "Calendario" };

export default function Page() {
  return (
    <Suspense fallback={<Esqueleto />}>
      <CalendarioV2 />
    </Suspense>
  );
}
