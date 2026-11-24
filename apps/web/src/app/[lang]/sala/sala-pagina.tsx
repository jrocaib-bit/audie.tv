import { loadAppCatalog } from "@audite/content/app-catalog";
import { obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { Placa } from "@/components/placa";
import { ProbarAudio } from "@/components/probar";
import { SalaCuenta, type MockSala } from "@/components/sala/sala-cuenta";
import { esObraSalaAbierta } from "@/lib/sala-abiertas";
import type { RespuestaSala } from "@/lib/sala-cuenta";
import { adelantoSala, resolverRecorrido } from "@/lib/sala-recorridos";
import { contextoSala, reportajePremium } from "@/lib/sala-reportaje";

/** `?mock=` (solo fuera de producción): sin | gratis | premium (con = premium). */
function mockDe(mock: string | undefined): MockSala | undefined {
  if (process.env.NODE_ENV === "production" || !mock) return undefined;
  if (mock === "gratis") return "gratis";
  if (mock === "premium" || mock === "con") return "premium";
  return "sin";
}

function recorridoAbiertoDe(id: string, lang: "es" | "en"): RespuestaSala | undefined {
  if (!esObraSalaAbierta(id)) return undefined;
  const r = resolverRecorrido(id, lang);
  if (!r) return undefined;
  const { radios, comparativa } = reportajePremium(id, lang);
  const pasos = r.pasos.map((p, i) => (radios[i] ? { ...p, radio: radios[i] } : p));
  return { acceso: "abierta", ...r, pasos, ...(comparativa ? { comparativa } : {}) };
}

/**
 * Página de una obra en La sala. El servidor entrega el adelanto (público) y, en las tres obras
 * abiertas, el recorrido completo. En el resto, pasos y cierre solo llegan desde /api/sala/[id]
 * tras comprobar la suscripción.
 */
export function SalaPagina({ lang, id, mock }: { lang: string; id: string; mock?: string }) {
  const ui = lang === "en" ? "en" : "es";
  const episodio = loadAppCatalog().episodes.find((item) => item.id === id);
  const obra = obraDeEpisodio(id);
  return (
    <ProbarAudio>
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
        recorridoInicial={recorridoAbiertoDe(id, ui)}
      />
    </ProbarAudio>
  );
}
