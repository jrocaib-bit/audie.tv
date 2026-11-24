"use client";

import { crearClienteLibros, type RecomendacionLibro } from "@audite/domain";
import { useEffect, useState } from "react";
import { ListaLibrosRecomendados } from "./cubierta";

/** Para el reproductor: pide las recomendaciones a la API y, si no hay, no pinta nada. */
export function LibrosDelEpisodio({ lang, episodioId }: { lang: string; episodioId: string }) {
  const [estado, setEstado] = useState<{ id: string; libros: RecomendacionLibro[] }>({ id: "", libros: [] });
  useEffect(() => {
    let vivo = true;
    void crearClienteLibros({ base: "" }).recomendaciones(episodioId).then((libros) => {
      if (vivo) setEstado({ id: episodioId, libros });
    });
    return () => {
      vivo = false;
    };
  }, [episodioId]);
  return <ListaLibrosRecomendados lang={lang} libros={estado.id === episodioId ? estado.libros : []} />;
}
