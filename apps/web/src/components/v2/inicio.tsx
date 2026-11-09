"use client";

import { COLOR_HEX, capitulosAMedias, diaLiturgico, estantes, referenciaPaso, type FiltroInicio } from "@audite/domain";
import { obrasVisibles } from "@audite/content/obras";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Mark } from "@/components/brand";
import { useLibrary } from "@/components/library";
import { Arte, EstanteFila, FilaContinua, TarjetaCuadro, TarjetaDia, TarjetaMix } from "@/components/v2/fichas";
import { fechaDeCuando, isoLocal } from "@/lib/cuando";
import { retosDeTiempo } from "@/lib/retos";

function saludo(locale: "es" | "en", hora: number): string {
  if (locale === "en") return hora < 12 ? "Good morning" : hora < 20 ? "Good afternoon" : "Good evening";
  return hora < 12 ? "Buenos días" : hora < 20 ? "Buenas tardes" : "Buenas noches";
}

const filtros: { id: FiltroInicio; es: string; en: string }[] = [
  { id: "todo", es: "Todo", en: "All" },
  { id: "caminos", es: "Caminos", en: "Paths" },
  { id: "libros", es: "Libros", en: "Books" },
  { id: "temas", es: "Temas", en: "Themes" },
];

export function InicioV2() {
  const library = useLibrary();
  const locale = library.settings.uiLocale;
  const [filtro, setFiltro] = useState<FiltroInicio>("todo");
  const cuando = useSearchParams().get("cuando");
  const ahora = useMemo(() => fechaDeCuando(cuando), [cuando]);
  const hora = ahora.getHours();
  const liturgia = diaLiturgico(ahora);
  const dia = Math.floor((ahora.getTime() - Date.parse(`${ahora.getFullYear()}-01-01`)) / 86400000);
  const nombre = (id: string) => {
    const libro = library.catalog.books.find((item) => item.id === id.split("-")[0]);
    const episodio = library.catalog.episodes.find((item) => item.id === id) ?? library.catalog.pendientes.find((item) => item.id === id);
    const obra = obrasVisibles().find((item) => item.episodio === id);
    return episodio?.etiqueta?.[locale] || episodio?.tituloCorto?.[locale] || obra?.capitulos || libro?.name[locale] || id;
  };
  const oibles = new Set(library.catalog.episodes.map((episodio) => episodio.id));
  const filas = estantes({
    locale,
    filtro,
    hora,
    diaDelAno: dia,
    escuchados: Object.entries(library.progress.episodes)
      .filter(([, episodio]) => episodio.positionSeconds > 0)
      .map(([id]) => ({ id, titulo: nombre(id) })),
    camino: library.path.steps.map((paso) => ({ id: paso.episodeId, titulo: nombre(paso.episodeId) })),
    libros: library.catalog.books.slice(0, 12).map((libro) => ({ id: libro.id, titulo: libro.name[locale] || libro.name.es })),
  });
  const demo = useSyncExternalStore(() => () => {}, () => document.documentElement.dataset.demo === "1", () => false);
  const aMedias = capitulosAMedias(library.progress.episodes);
  const sigueIds = aMedias.length > 0 ? aMedias : demo ? ["gn-01"] : [];
  const sigue = sigueIds.slice(0, 6).map((id) => ({
    id,
    href: oibles.has(id) ? `/ahora?e=${id}` : `/libro/${id.split("-")[0]}`,
    titulo: obrasVisibles().find((obra) => obra.episodio === id)?.capitulos || nombre(id),
    episodioId: id,
  }));
  const delTiempo = retosDeTiempo(liturgia.tiempo);
  const paso = delTiempo[0]?.pasos[Math.max(0, liturgia.dia - 1) % Math.max(1, delTiempo[0]?.pasos.length ?? 1)];
  const usadas = new Set(sigueIds);
  function tomar(id: string | null | undefined): string | null {
    if (id && !usadas.has(id)) {
      usadas.add(id);
      return id;
    }
    const libre = obrasVisibles().find((obra) => !usadas.has(obra.episodio));
    if (!libre) return id ?? null;
    usadas.add(libre.episodio);
    return libre.episodio;
  }
  const portadaDia = tomar(paso?.obra);
  const estanteTiempo = delTiempo.flatMap((reto) => [
    { id: reto.id, href: `/reto/${reto.id}?cuando=${isoLocal(ahora)}`, titulo: reto.titulo[locale], obra: tomar(reto.obra) },
    ...reto.companeros.map((companero) => ({ id: `${reto.id}-${companero.href}`, href: companero.href, titulo: companero.titulo[locale], obra: tomar(companero.obra) })),
  ]);

  return (
    <main id="contenido" className="app-clear pt-3">
      <div className="flex items-center justify-between px-4">
        <Link href={`/${locale}`} aria-label="Audite" className="inline-flex min-h-11 items-center">
          <Mark className="size-8 rounded-lg" />
        </Link>
        <Link href="/ajustes" aria-label={locale === "en" ? "Settings" : "Ajustes"} className="inline-flex size-11 items-center justify-center rounded-full border border-border text-sm">
          A
        </Link>
      </div>
      <h1 className="font-display mt-2 px-4 text-4xl leading-none">{saludo(locale, hora)}</h1>
      <div className="estante mt-4 flex gap-2 overflow-x-auto px-4">
        {filtros.map((item) => (
          <button key={item.id} type="button" className={`neo-chip shrink-0 ${filtro === item.id ? "border-acento bg-acento text-acento-ink" : ""}`} onClick={() => setFiltro(item.id)}>
            {locale === "en" ? item.en : item.es}
          </button>
        ))}
      </div>
      {filtro === "todo" && delTiempo[0] ? (
        <TarjetaDia
          href={`/reto/${delTiempo[0].id}?cuando=${isoLocal(ahora)}`}
          calendario={`/calendario?cuando=${isoLocal(ahora)}`}
          titulo={liturgia.etiqueta[locale]}
          subtitulo={paso ? `${paso.titulo[locale]} · ${referenciaPaso(paso, locale)}` : undefined}
          clave={portadaDia ?? delTiempo[0].id}
          filete={COLOR_HEX[liturgia.color]}
        />
      ) : null}
      {filtro === "todo" && estanteTiempo.length > 0 ? (
        <EstanteFila titulo={locale === "en" ? "For this season" : "Para este tiempo"}>
          {estanteTiempo.map((ficha) => (
            <Link key={ficha.id} href={ficha.href} className="w-[10.5rem] shrink-0 snap-start">
              <span className="relative block h-28 overflow-hidden rounded-2xl bg-[#1B1815]">
                <Arte episodioId={ficha.obra} className="absolute inset-0 h-full w-full" />
                <span className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/20 to-transparent" />
                <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: COLOR_HEX[liturgia.color] }} />
                <span className="absolute inset-x-2.5 bottom-2.5 font-display text-base leading-tight text-[#F4ECE2]">{ficha.titulo}</span>
              </span>
            </Link>
          ))}
        </EstanteFila>
      ) : null}
      {filtro === "todo" && sigue.length > 0 ? <FilaContinua titulo={locale === "en" ? "Continue" : "Sigue escuchando"} tarjetas={sigue} /> : null}
      {filas.filter((estante) => estante.id !== "sigue").map((estante) => (
        <EstanteFila key={estante.id} titulo={estante.titulo}>
          {estante.tarjetas.map((tarjeta) => estante.id === "hora" ? (
            <TarjetaMix key={tarjeta.id} href={tarjeta.href} titulo={tarjeta.titulo} clave={tarjeta.id} />
          ) : (
            <TarjetaCuadro
              key={tarjeta.id}
              href={tarjeta.href}
              episodioId={tarjeta.episodioId}
              titulo={tarjeta.titulo}
              pronto={Boolean(tarjeta.episodioId) && !oibles.has(tarjeta.episodioId ?? "") && tarjeta.href.startsWith("/ahora")}
              prontoTexto={locale === "en" ? "Soon" : "Pronto"}
            />
          ))}
        </EstanteFila>
      ))}
    </main>
  );
}
