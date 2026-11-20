import type { Sesion } from "@audite/domain";
import { usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { sesionApp } from "../auth";

/** Sesión actual (null sin cuenta). Se vuelve a leer al cambiar de pantalla. */
export function useSesion(): Sesion | null {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const path = usePathname();
  useEffect(() => {
    let vivo = true;
    void sesionApp().then((s) => {
      if (vivo) setSesion(s);
    });
    return () => {
      vivo = false;
    };
  }, [path]);
  return sesion;
}
