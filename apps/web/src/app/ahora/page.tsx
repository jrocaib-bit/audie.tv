import type { Metadata } from "next";
import { ReproductorV2 } from "@/components/v2/reproductor";

export const metadata: Metadata = { title: "Ahora" };
// El interruptor del texto se lee en cada petición, nunca se congela en el build.
export const dynamic = "force-dynamic";

export default function Page() {
  // El texto nunca se pinta aquí. Solo se decide si el panel existe. El panel lo pide a /api/texto.
  return <ReproductorV2 textoActivo={process.env.TEXTO_BIBLICO_ACTIVO?.trim() === "1"} />;
}
