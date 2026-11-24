import { loadAppCatalog } from "@audite/content/app-catalog";
import { obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { Placa } from "@/components/placa";
import { SalaCuenta, type MockSala } from "@/components/sala/sala-cuenta";
import { adelantoSala } from "@/lib/sala-recorridos";
import { contextoSala } from "@/lib/sala-reportaje";

/** `?mock=` (solo fuera de producción): sin | gratis | premium (con = premium). */
function mockDe(mock: string | undefined): MockSala | undefined {
  if (process.env.NODE_ENV === "production" || !mock) return undefined;
  if (mock === "gratis") return "gratis";
  if (mock === "premium" || mock === "con") return "premium";
  return "sin";
}

/**
 * Página de La sala para un episodio. El servidor entrega solo el adelanto (obra, título y apertura, que es público);
 * pasos y cierre nunca viajan aquí: el cliente los pide a /api/sala/[id], que los da solo a premium verificado.
 */
export function SalaPagina({ lang, id, mock }: { lang: string; id: string; mock?: string }) {
  const ui = lang === "en" ? "en" : "es";
  const episodio = loadAppCatalog().episodes.find((item) => item.id === id);
  const obra = obraDeEpisodio(id);
  return (
    <SalaCuenta
      lang={ui}
      id={id}
      src={obra ? obraWebp(obra) : ""}
      obraId={obra?.id}
      alt={obra?.titulo[ui] ?? ""}
      titulo={obra?.titulo[ui] ?? episodio?.titulo?.[ui] ?? id}
      adelanto={adelantoSala(id, ui) ?? undefined}
      contexto={contextoSala(id, ui)}
      placa={obra ? <Placa obra={obra} lang={ui} /> : undefined}
      sesionMock={mockDe(mock)}
    />
  );
}
