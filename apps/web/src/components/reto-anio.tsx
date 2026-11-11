import { RetoEscucha } from "@/components/reto-escucha";
import { modeloDeReto } from "@/lib/reto-vista";
import type { RangoEpisodio, RetoAnioDato } from "@/lib/retos-anio";

export function VistaRetoAnio({ lang, reto, rangos }: { lang: string; reto: RetoAnioDato; rangos: readonly RangoEpisodio[] }) {
  const ui = lang === "en" ? "en" : "es";
  return <RetoEscucha lang={ui} modelo={modeloDeReto(reto, rangos, ui)} />;
}
