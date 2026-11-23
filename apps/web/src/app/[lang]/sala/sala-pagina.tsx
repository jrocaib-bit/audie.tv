import { loadAppCatalog } from "@audite/content/app-catalog";
import { obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { Placa } from "@/components/placa";
import { SalaCuenta } from "@/components/sala/sala-cuenta";

/** Página de La sala para un episodio. NUNCA recibe ni envía el recorrido: el cliente lo pide con sesión a /api/sala/[id]. `mock` solo existe fuera de producción (capturas). */
export function SalaPagina({ lang, id, mock }: { lang: string; id: string; mock?: string }) {
  const ui = lang === "en" ? "en" : "es";
  const episodio = loadAppCatalog().episodes.find((item) => item.id === id);
  const obra = obraDeEpisodio(id);
  const sesionMock = process.env.NODE_ENV !== "production" && mock ? (mock === "con" ? { userId: "mock" } : null) : undefined;
  return (
    <SalaCuenta
      lang={ui}
      id={id}
      src={obra ? obraWebp(obra) : ""}
      obraId={obra?.id}
      alt={obra?.titulo[ui] ?? ""}
      titulo={obra?.titulo[ui] ?? episodio?.titulo?.[ui] ?? id}
      placa={obra ? <Placa obra={obra} lang={ui} /> : undefined}
      sesionMock={sesionMock}
    />
  );
}
