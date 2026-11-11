"use client";

import { medir } from "@/lib/medicion";

export function EnlaceSoporte({ children, className, idioma }: { children: React.ReactNode; className?: string; idioma: string }) {
  return (
    <a
      href="mailto:soporte@audite.tv"
      className={className}
      onClick={() => medir("cta_clicked", { form_id: "soporte", cta_id: "mailto_soporte", ubicacion: "enlace", idioma, plataforma: "web" })}
    >
      {children}
    </a>
  );
}
