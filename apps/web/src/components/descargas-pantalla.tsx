"use client";

import { idiomaContenido,
  espacioUsado,
  idsDeAlcance,
  parseArchivos,
  parsePreferencia,
  planificar,
  puedeBajar,
  quitarArchivo,
  textoEspacio,
  CLAVE_DESCARGA_PREFERENCIA,
  CLAVE_DESCARGAS,
  type AlcanceDescarga,
  type ArchivoLocal,
  type EpisodioDescargable,
  type Red,
} from "@audite/domain";
import { useSyncExternalStore, useState } from "react";
import { useLibrary } from "@/components/library";

type EstadoLocal = { soloWifi: boolean; archivos: ArchivoLocal[] };
const vacio: EstadoLocal = { soloWifi: true, archivos: [] };
let estado: EstadoLocal = vacio;
let hidratado = false;
const oyentes = new Set<() => void>();

function hidratar() {
  if (hidratado || typeof localStorage === "undefined") return;
  hidratado = true;
  estado = {
    soloWifi: parsePreferencia(leer(CLAVE_DESCARGA_PREFERENCIA)).soloWifi,
    archivos: parseArchivos(leer(CLAVE_DESCARGAS)),
  };
}

function leerEstado(): EstadoLocal {
  hidratar();
  return estado;
}

function publicar(siguiente: EstadoLocal) {
  estado = siguiente;
  localStorage.setItem(CLAVE_DESCARGA_PREFERENCIA, JSON.stringify({ soloWifi: siguiente.soloWifi }));
  localStorage.setItem(CLAVE_DESCARGAS, JSON.stringify({ archivos: siguiente.archivos }));
  oyentes.forEach((oyente) => oyente());
}

function tx(locale: string, es: string, en: string): string {
  return locale === "en" ? en : es;
}

function leer(clave: string): unknown {
  try {
    const raw = localStorage.getItem(clave);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export function DescargasPantalla() {
  const { catalog, settings, progress, path } = useLibrary();
  const locale = settings.uiLocale;
  const { soloWifi, archivos } = useSyncExternalStore(
    (avisar) => {
      oyentes.add(avisar);
      return () => oyentes.delete(avisar);
    },
    leerEstado,
    () => vacio,
  );
  const [red, setRed] = useState<Red>("wifi");
  const [alcance, setAlcance] = useState<AlcanceDescarga>("episodio");
  const [aviso, setAviso] = useState("");
  const episodios: EpisodioDescargable[] = catalog.episodes.map((episodio) => ({
    id: episodio.id,
    bookId: episodio.bookId,
    titulo: episodio.tituloCorto?.[idiomaContenido(locale)] || episodio.title,
    bytes: episodio.segments.reduce((suma, segmento) => suma + segmento.bytes, 0),
    remoto: episodio.segments[0]?.publicPath ?? "",
  }));
  const oidos = new Set(Object.entries(progress.episodes).filter(([, episodio]) => episodio.completed || episodio.positionSeconds > 0).map(([id]) => id));
  const ids = idsDeAlcance(alcance, episodios, {
    episodioId: episodios[0]?.id,
    bookId: episodios[0]?.bookId ?? "gn",
    camino: path.steps.map((paso) => paso.episodeId),
    oidos,
  });
  const plan = planificar(ids, archivos);
  const redMotivo = puedeBajar(soloWifi, red);

  function guardarPreferencia(valor: boolean) {
    publicar({ soloWifi: valor, archivos });
  }

  function pedir() {
    if (redMotivo !== "listo") {
      setAviso(redMotivo === "sin-red"
        ? tx(locale, "No hay red.", "There is no network.")
        : tx(locale, "Solo Wi-Fi está activo. Con datos móviles no se baja.", "Wi-Fi only is on. Cellular data will not download."));
      return;
    }
    if (plan.nuevos.length === 0) {
      setAviso(tx(locale, "No hay un máster nuevo que guardar.", "There is no new master to keep."));
      return;
    }
    setAviso(tx(
      locale,
      "En el navegador no se guarda el audio. La app lo baja al dispositivo y el reproductor usa ese archivo.",
      "The browser does not keep the audio. The app downloads it, and the player uses that file.",
    ));
  }

  function borrar(id: string) {
    publicar({ soloWifi, archivos: quitarArchivo(archivos, id) });
  }

  return (
    <main id="contenido" className="app-clear mx-auto w-full max-w-lg px-4 pt-4">
      <h1 className="font-display text-4xl leading-none">{tx(locale, "Descargas", "Downloads")}</h1>
      <section className="neo-card mt-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <p>{tx(locale, "Solo Wi-Fi", "Wi-Fi only")}</p>
          <button type="button" className={`min-h-11 rounded-full px-4 text-sm ${soloWifi ? "bg-acento text-acento-ink" : "border border-border"}`} onClick={() => guardarPreferencia(!soloWifi)}>
            {soloWifi ? tx(locale, "Activo", "On") : tx(locale, "No", "Off")}
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          {(["wifi", "celular", "sin-red"] as const).map((opcion) => (
            <button key={opcion} type="button" className={`neo-chip ${red === opcion ? "border-acento" : ""}`} onClick={() => setRed(opcion)}>
              {opcion === "wifi" ? "Wi-Fi" : opcion === "celular" ? tx(locale, "Datos", "Cellular") : tx(locale, "Sin red", "Offline")}
            </button>
          ))}
        </div>
      </section>
      <div className="mt-3 flex flex-wrap gap-2">
        {([
          ["episodio", tx(locale, "Este episodio", "This episode")],
          ["libro", tx(locale, "Este libro", "This book")],
          ["semana", tx(locale, "Camino de la semana", "This week's path")],
        ] as const).map(([id, etiqueta]) => (
          <button key={id} type="button" className={`neo-chip ${alcance === id ? "border-acento" : ""}`} onClick={() => setAlcance(id)}>
            {etiqueta}
          </button>
        ))}
      </div>
      <section className="neo-card mt-3 p-4">
        <p className="kicker text-muted">{tx(locale, "Para bajar", "To download")}</p>
        {plan.nuevos.length === 0 && plan.ya.length === 0 ? (
          <p className="mt-2 text-sm">{tx(locale, "Pronto", "Soon")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {ids.map((id) => {
              const episodio = episodios.find((item) => item.id === id);
              return (
                <li key={id} className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-lg leading-tight">{episodio?.titulo ?? id}</span>
                  <span className="tabular shrink-0 text-xs text-muted">{textoEspacio(episodio?.bytes ?? 0, locale)}</span>
                </li>
              );
            })}
          </ul>
        )}
        <button type="button" className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-acento px-4 text-sm text-acento-ink" onClick={pedir}>
          {tx(locale, "Pedir en la app", "Request in the app")}
        </button>
        {aviso ? <p className="mt-3 text-sm">{aviso}</p> : null}
      </section>
      <section className="neo-card mt-3 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl leading-none">{tx(locale, "En el dispositivo", "On device")}</h2>
          <p className="cifra text-xl">{textoEspacio(espacioUsado(archivos), locale)}</p>
        </div>
        {archivos.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{tx(locale, "Nada guardado", "Nothing saved")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {archivos.map((archivo) => (
              <li key={archivo.episodeId} className="flex items-center justify-between gap-3">
                <span>{archivo.episodeId}</span>
                <button type="button" className="min-h-11 text-sm text-acento" onClick={() => borrar(archivo.episodeId)}>{tx(locale, "Borrar", "Delete")}</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
