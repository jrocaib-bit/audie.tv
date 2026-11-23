import type { Metadata } from "next";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { Placa } from "@/components/placa";
import { SalaCuenta } from "@/components/sala/sala-cuenta";

const ID = "gn-01"; // Piloto de La sala: Paraíso y obra de gn-01.

export const metadata: Metadata = { title: "La sala" };

export default async function Page({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ mock?: string }> }) {
  const { lang } = await params;
  const { mock } = await searchParams;
  const ui = lang === "en" ? "en" : "es";
  const episodio = loadAppCatalog().episodes.find((item) => item.id === ID);
  const obra = obraDeEpisodio(ID);
  // Solo desarrollo (capturas): simula la sesión sin iniciar ninguna real.
  const sesionMock = process.env.NODE_ENV !== "production" && mock ? (mock === "con" ? { userId: "mock" } : null) : undefined;
  return (
    <SalaCuenta
      lang={ui}
      src={obra ? obraWebp(obra) : ""}
      obraId={obra?.id}
      alt={obra?.titulo[ui] ?? ""}
      titulo={obra?.titulo[ui] ?? episodio?.titulo?.[ui] ?? ID}
      resumen={episodio?.summary?.[ui] || episodio?.summary?.es || ""}
      placa={obra ? <Placa obra={obra} lang={ui} /> : undefined}
      sesionMock={sesionMock}
    />
  );
}
