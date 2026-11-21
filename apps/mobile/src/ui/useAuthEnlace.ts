import { esEnlaceAuth } from "@audite/domain";
import * as Linking from "expo-linking";
import { useEffect } from "react";
import { aplicarEnlaceAuth } from "../auth";

/** Atiende el enlace de acceso al abrir la app y si llega con la app ya en segundo plano. */
export function useAuthEnlace() {
  useEffect(() => {
    const vistos = new Set<string>();
    const tratar = (url: string | null) => {
      if (!url || vistos.has(url) || !esEnlaceAuth(url)) return;
      vistos.add(url);
      void aplicarEnlaceAuth(url);
    };
    void Linking.getInitialURL().then(tratar);
    const sub = Linking.addEventListener("url", ({ url }) => tratar(url));
    return () => sub.remove();
  }, []);
}
