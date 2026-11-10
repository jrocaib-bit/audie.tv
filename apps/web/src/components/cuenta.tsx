"use client";

import { textosAlta, type Sesion } from "@audite/domain";
import Link from "next/link";
import { useEffect, useState } from "react";
import { borrarWeb, cerrarWeb, sesionWeb } from "@/lib/auth-web";

export function Cuenta({ lang }: { lang: string }) {
  const copy = textosAlta(lang);
  const [sesion, setSesion] = useState<Sesion | null | undefined>(undefined);
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() => {
    void sesionWeb().then(setSesion);
  }, []);

  if (!sesion) {
    return (
      <section className="mt-2">
        <h2 className="kicker px-1 text-muted">{copy.cuenta}</h2>
        <Link href={`/${lang}/entrar`} className="neo-card mt-2 flex min-h-12 items-center px-4">{copy.entrar}</Link>
      </section>
    );
  }

  return (
    <section className="mt-2">
      <h2 className="kicker px-1 text-muted">{copy.cuenta}</h2>
      <div className="neo-card mt-2 divide-y divide-border">
        {sesion.email ? <p className="px-4 py-3 text-sm text-muted">{sesion.email}</p> : null}
        <button type="button" className="flex min-h-12 w-full items-center px-4 text-left" onClick={() => void cerrarWeb().then(() => setSesion(null))}>
          {copy.salir}
        </button>
        {confirmar ? (
          <div className="grid gap-2 px-4 py-3">
            <p>{copy.confirmar}</p>
            <div className="flex gap-2">
              <button type="button" className="inline-flex min-h-11 items-center px-3" onClick={() => setConfirmar(false)}>{copy.cancelar}</button>
              <button type="button" className="inline-flex min-h-11 items-center px-3" onClick={() => void borrarWeb().then(() => setSesion(null))}>{copy.borrar}</button>
            </div>
          </div>
        ) : (
          <button type="button" className="flex min-h-12 w-full items-center px-4 text-left" onClick={() => setConfirmar(true)}>
            {copy.borrar}
          </button>
        )}
      </div>
    </section>
  );
}
