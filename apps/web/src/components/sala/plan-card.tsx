import type { ReactNode } from "react";
import { PRECIO, etiquetaDeLanzamiento, letraDeLanzamiento } from "@audite/domain";
import { cn } from "@/lib/utils";

type Plan = "anual" | "mensual";

function sinCentimos(precio: string): string {
  return precio.replace(/,00(?=\s|$)/, "");
}

/**
 * Anual destacado (8 €), mensual secundario (1,99 €), un solo CTA (children) y microcopy.
 * No toca la lógica de compra: el CTA llega de fuera.
 */
export function PlanCard({
  ui,
  lanzamiento = false,
  plan,
  onPlan,
  children,
  className,
}: {
  ui: "es" | "en";
  lanzamiento?: boolean;
  plan?: Plan;
  onPlan?: (plan: Plan) => void;
  children?: ReactNode;
  className?: string;
}) {
  const es = ui === "es";
  const etiqueta = etiquetaDeLanzamiento(ui, lanzamiento);
  const letra = letraDeLanzamiento(ui, lanzamiento);
  const anual = plan !== "mensual";
  const tarjeta = (id: Plan, destacado: boolean, contenido: ReactNode) => {
    const clase = cn("block w-full rounded-3xl border px-6 py-6 text-left", destacado ? "border-[#C9A96E] bg-[#1B1815]" : "border-[#2E2924]");
    return onPlan ? (
      <button type="button" aria-pressed={plan === id} className={cn(clase, "sala-boton")} onClick={() => onPlan(id)}>{contenido}</button>
    ) : (
      <div className={clase}>{contenido}</div>
    );
  };
  return (
    <div className={cn("grid gap-3", className)} data-plan-card="">
      {tarjeta("anual", anual, (
        <>
          <span className="t-rotulo inline-block rounded-full bg-[#C9A96E] px-3 py-1.5 text-[#100E0C]">{es ? "ahorra un 66 %" : "save 66%"}</span>
          <span className="mt-3 flex items-baseline gap-2">
            <span className="font-display t-cifra">{sinCentimos(PRECIO.anio)}</span>
            <span className="text-[#B7AB9C]">/ {es ? "año" : "year"}</span>
          </span>
          <span className="t-meta mt-1 block">{es ? "7 días gratis" : "7 days free"}</span>
          {etiqueta ? <span className="mt-2 block text-sm text-[#C9A96E]">{etiqueta}</span> : null}
          {letra ? <span className="t-meta mt-1 block">{letra}</span> : null}
        </>
      ))}
      {tarjeta("mensual", !anual, (
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-[#B7AB9C]">{es ? "Mensual" : "Monthly"}</span>
          <span><span className="font-display text-2xl">{PRECIO.mes}</span> <span className="text-[#B7AB9C]">/ {es ? "mes" : "month"}</span></span>
        </span>
      ))}
      {children ? <div className="mt-2">{children}</div> : null}
      <p className="t-meta">{es ? "Luego 8 €/año. Cancela cuando quieras." : "Then €8/year. Cancel anytime."}</p>
    </div>
  );
}
