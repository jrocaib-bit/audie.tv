"use client";

import Link from "next/link";
import { aplicarSubrayados, hrefEpisodioDesdeLibro, textoDeTrozos, trozosDeHtml, type BloqueLibro, type NotaLibro, type SubrayadoLibro } from "@audite/domain";
import { useMemo } from "react";

type Props = {
  lang: string;
  bloque: BloqueLibro;
  subrayados: SubrayadoLibro[];
  notas: NotaLibro[];
  marcado: boolean;
  activo: boolean;
  rutaVuelta: string;
  onActivar: (bloqueId: string, subrayadoId: string | null) => void;
};

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Un bloque del libro. Cada trozo lleva `data-o` con su desplazamiento sobre el texto del bloque,
 * y solo un nodo de texto, para que un subrayado se ancle igual en la web y en la app.
 */
export function BloqueTexto({ lang, bloque, subrayados, notas, marcado, activo, rutaVuelta, onActivar }: Props) {
  const trozos = useMemo(() => trozosDeHtml(bloque.html), [bloque.html]);
  const largo = useMemo(() => textoDeTrozos(trozos).length, [trozos]);
  const pintados = useMemo(
    () => aplicarSubrayados(trozos, subrayados.map((s) => ({ id: s.id, inicio: s.inicio, fin: s.fin }))),
    [trozos, subrayados],
  );
  // Desplazamiento de cada trozo sobre el texto del bloque.
  const longitudes = pintados.map((trozo) => (trozo.tipo === "br" ? 1 : trozo.texto.length));
  const inicios = longitudes.map((_, i) => longitudes.slice(0, i).reduce((suma, n) => suma + n, 0));
  const hijos = pintados.map((trozo, indice) => {
    if (trozo.tipo === "br") return <br key={indice} />;
    const o = inicios[indice] ?? 0;
    const sub = "subrayados" in trozo ? trozo.subrayados?.[0] : undefined;
    const comunes = { "data-o": o, ...(sub ? { "data-subrayado": sub } : {}) } as Record<string, string | number>;
    const clase = sub ? "lector-subrayado" : undefined;
    if (trozo.tipo === "ref") {
      return (
        <Link key={indice} {...comunes} href={hrefEpisodioDesdeLibro(lang, trozo.episodio, rutaVuelta)} data-episodio={trozo.episodio} className={`ref-biblica ${clase ?? ""} ${trozo.em ? "italic" : ""}`.trim()}>
          {trozo.texto}
        </Link>
      );
    }
    if (trozo.strong) return <strong key={indice} {...comunes} className={clase}>{trozo.texto}</strong>;
    if (trozo.em) return <em key={indice} {...comunes} className={clase}>{trozo.texto}</em>;
    return <span key={indice} {...comunes} className={clase}>{trozo.texto}</span>;
  });
  const clase = bloque.tipo === "pasaje" ? "lector-pasaje" : bloque.tipo === "subtitulo" ? "lector-subtitulo" : "";
  return (
    <div
      id={bloque.id}
      data-bloque={bloque.id}
      data-largo={largo}
      data-activo={activo ? "1" : "0"}
      {...(marcado ? { "data-marcador": bloque.id } : {})}
      className="lector-bloque"
      onClick={(evento) => {
        const objetivo = evento.target as HTMLElement;
        if (objetivo.closest("a")) return;
        if (window.getSelection()?.toString()) return;
        onActivar(bloque.id, objetivo.closest("[data-subrayado]")?.getAttribute("data-subrayado") ?? null);
      }}
    >
      {marcado ? <span className="lector-marcador" aria-label="Marcador" role="img" /> : null}
      {bloque.tipo === "subtitulo" ? <h3 className={clase}>{hijos}</h3> : <p className={clase}>{hijos}</p>}
      {notas.map((nota) => (
        <aside key={nota.id} data-nota={nota.id} className="lector-nota">
          <time dateTime={nota.created_at}>{fecha(nota.created_at)}</time>
          {nota.texto}
        </aside>
      ))}
    </div>
  );
}
