"use client";

import { CLAVE_AVISOS, diaLiturgico, parsePlanAviso, planVacio, textoAvisoLiturgico, type DiaAviso, type PlanAviso } from "@audite/domain";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useLibrary } from "@/components/library";

const vacio = planVacio();
let plan = vacio;
let hidratado = false;
const oyentes = new Set<() => void>();

function leer(): PlanAviso {
  if (!hidratado && typeof localStorage !== "undefined") {
    hidratado = true;
    try {
      plan = parsePlanAviso(JSON.parse(localStorage.getItem(CLAVE_AVISOS) || "null") as unknown);
    } catch {
      plan = vacio;
    }
  }
  return plan;
}

function publicar(siguiente: PlanAviso) {
  plan = siguiente;
  localStorage.setItem(CLAVE_AVISOS, JSON.stringify(siguiente));
  oyentes.forEach((oyente) => oyente());
}

const dias: { id: DiaAviso; es: string; en: string }[] = [
  { id: 1, es: "L", en: "M" },
  { id: 2, es: "M", en: "T" },
  { id: 3, es: "X", en: "W" },
  { id: 4, es: "J", en: "T" },
  { id: 5, es: "V", en: "F" },
  { id: 6, es: "S", en: "S" },
  { id: 0, es: "D", en: "S" },
];

export function AvisosPantalla() {
  const { settings } = useLibrary();
  const locale = settings.uiLocale;
  const actual = useSyncExternalStore(
    (avisar) => {
      oyentes.add(avisar);
      return () => oyentes.delete(avisar);
    },
    leer,
    () => vacio,
  );
  const [hora, setHora] = useState(`${String(actual.hora).padStart(2, "0")}:${String(actual.minuto).padStart(2, "0")}`);
  const texto = useMemo(() => textoAvisoLiturgico(diaLiturgico(new Date()), locale), [locale]);
  const [horas, minutos] = hora.split(":").map((parte) => Number(parte));
  const previsto = { ...actual, hora: Number.isFinite(horas) ? horas : actual.hora, minuto: Number.isFinite(minutos) ? minutos : actual.minuto };

  function cambiar(parcial: Partial<PlanAviso>) {
    const siguiente = parsePlanAviso({ ...previsto, ...parcial });
    publicar(siguiente);
  }

  return (
    <main id="contenido" className="app-clear mx-auto w-full max-w-lg px-4 pt-4">
      <h1 className="font-display text-4xl leading-none">{locale === "en" ? "Reminders" : "Avisos"}</h1>
      <section className="neo-card mt-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <p>{locale === "en" ? "Enabled" : "Activados"}</p>
          <button type="button" className={`min-h-11 rounded-full px-4 text-sm ${actual.activo ? "bg-acento text-acento-ink" : "border border-border"}`} onClick={() => cambiar({ activo: !actual.activo })}>
            {actual.activo ? (locale === "en" ? "On" : "Sí") : (locale === "en" ? "Off" : "No")}
          </button>
        </div>
        <label className="mt-4 block text-sm">
          {locale === "en" ? "Time" : "Hora"}
          <input className="neo-card mt-2 min-h-11 w-full bg-transparent px-3" type="time" value={hora} onChange={(event) => { setHora(event.target.value); const [h, m] = event.target.value.split(":"); cambiar({ hora: Number(h), minuto: Number(m) }); }} />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          {dias.map((dia) => {
            const activo = actual.dias.includes(dia.id);
            return (
              <button key={dia.id} type="button" className={`inline-flex size-11 items-center justify-center rounded-full border ${activo ? "border-acento bg-acento text-acento-ink" : "border-border"}`} onClick={() => cambiar({ dias: activo ? actual.dias.filter((item) => item !== dia.id) : [...actual.dias, dia.id] })}>
                {locale === "en" ? dia.en : dia.es}
              </button>
            );
          })}
        </div>
      </section>
      <section className="neo-card mt-3 p-4">
        <p className="font-display text-3xl leading-tight">{texto}</p>
      </section>
    </main>
  );
}
