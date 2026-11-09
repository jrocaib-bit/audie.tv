import { Suspense } from "react";
import { CalendarioV2 } from "@/components/v2/calendario";

export const metadata = { title: "Calendario" };

export default function Page() {
  return (
    <Suspense>
      <CalendarioV2 />
    </Suspense>
  );
}
