"use client";

import { useEffect } from "react";
import { medir } from "@/lib/medicion";

export function ConfirmadoLista() {
  useEffect(() => {
    medir("signup_confirmed", { form_id: "lista_correo", cta_id: "confirmar", ubicacion: "correo", idioma: "es", plataforma: "web", opt_in_correo: true });
  }, []);
  return null;
}
