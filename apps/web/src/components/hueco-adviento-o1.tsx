"use client";

import { obraRetoPorId } from "@audite/content/obras-creditos";
import { BucleCuadro } from "@/components/bucle-cuadro";
import { bucleDeEpisodio, estiloDeHueco } from "@/lib/bucles";

const CLAVE = "reto:adviento-isaias:o1";
const OBRA = "reto-adviento_o1";

function mapaPublico(json?: string): string | undefined {
  if (json !== undefined) return json;
  return process.env.NEXT_PUBLIC_BUCLES_JSON;
}

/** Segundo cuadro de Adviento (Hicks). Si la clave no está en el mapa, no pinta nada. */
export function HuecoAdvientoO1({ lang = "es", json }: { lang?: string; json?: string }) {
  const bucle = bucleDeEpisodio(CLAVE, mapaPublico(json));
  const poster = bucle?.poster || bucle?.posterMovil || "";
  if (!bucle || !poster) return null;
  const ui = lang === "en" ? "en" : "es";
  const credito = obraRetoPorId(OBRA);
  return (
    <figure className="mx-auto mt-8 w-full">
      <div className="relative mx-auto" style={estiloDeHueco(bucle.aspect)}>
        <BucleCuadro bucle={{ ...bucle, poster }} />
      </div>
      {credito ? <figcaption className="mt-2 text-center text-sm text-[#B7AB9C]">{credito.titulo[ui]} · {credito.autor[ui]}</figcaption> : null}
    </figure>
  );
}
