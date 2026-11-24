"use client";

import {
  CLAVE_TEXTO_MODO,
  CLAVE_TEXTO_TAMANO,
  PALETA_TEXTO,
  PAUSA_DESPLAZAMIENTO_MS,
  TAMANOS_TEXTO,
  TAMANO_INICIAL,
  estadoDeRespuesta,
  estaSincronizado,
  leerModo,
  leerTamano,
  leerTextoEpisodio,
  marcasDeTiempo,
  pasoTamano,
  textosPanel,
  versiculoActual,
  type EstadoTexto,
  type ModoTexto,
  type TextoEpisodio,
} from "@audite/domain";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { destinoSiFalla } from "@/lib/audio-acceso";
import { supabaseWeb } from "@/lib/auth-web";
import { mockDeBusqueda } from "@/lib/texto/simulacion";

type Textos = ReturnType<typeof textosPanel>;

const FOCO = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]";
const TECLAS_SCROLL = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

function leerPreferencia(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function guardarPreferencia(clave: string, valor: string) {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    /* Sin almacenamiento, la preferencia dura la sesión. */
  }
}

function sistemaReduce(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function usePreferencias() {
  const [tamano, setTamano] = useState(TAMANO_INICIAL);
  const [modo, setModo] = useState<ModoTexto>("noche");
  useEffect(() => {
    // Se leen tras montar para que el HTML del servidor y el del cliente coincidan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTamano(leerTamano(leerPreferencia(CLAVE_TEXTO_TAMANO)));
    setModo(leerModo(leerPreferencia(CLAVE_TEXTO_MODO)));
  }, []);
  return {
    tamano,
    modo,
    cambiarTamano(delta: -1 | 1) {
      const siguiente = pasoTamano(tamano, delta);
      setTamano(siguiente);
      guardarPreferencia(CLAVE_TEXTO_TAMANO, String(siguiente));
    },
    alternarModo() {
      const siguiente: ModoTexto = modo === "noche" ? "dia" : "noche";
      setModo(siguiente);
      guardarPreferencia(CLAVE_TEXTO_MODO, siguiente);
    },
  };
}

type Carga = { tipo: Exclude<EstadoTexto, "listo"> } | { tipo: "listo"; texto: TextoEpisodio };

/** Contenedor: pide el texto a la API con la misma sesión que el audio y pinta el estado. */
export function PanelTexto({
  episodioId,
  idioma,
  uiLocale,
  tiempo,
  onSaltar,
  reducirMovimiento,
}: {
  episodioId: string;
  idioma: "es" | "en";
  uiLocale: string;
  tiempo: number;
  onSaltar: (segundo: number) => void;
  reducirMovimiento: boolean;
}) {
  const [carga, setCarga] = useState<Carga>({ tipo: "cargando" });
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    let vivo = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCarga({ tipo: "cargando" });
    (async () => {
      const headers = new Headers();
      const sesion = await supabaseWeb()?.auth.getSession();
      const token = sesion?.data.session?.access_token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const mock = mockDeBusqueda(window.location.search, process.env.NODE_ENV);
      if (mock) headers.set("x-texto-mock", mock);
      const respuesta = await fetch(`/api/texto/${encodeURIComponent(episodioId)}?lang=${idioma}`, { headers, cache: "no-store" });
      if (!vivo) return;
      if (!respuesta.ok) {
        let error: unknown;
        try {
          error = ((await respuesta.json()) as { error?: unknown }).error;
        } catch {
          error = undefined;
        }
        if (vivo) setCarga({ tipo: estadoDeRespuesta(respuesta.status, error) });
        return;
      }
      const texto = leerTextoEpisodio(await respuesta.json());
      if (vivo) setCarga(texto ? { tipo: "listo", texto } : { tipo: "error" });
    })().catch(() => {
      if (vivo) setCarga({ tipo: "error" });
    });
    return () => {
      vivo = false;
    };
  }, [episodioId, idioma, intento]);

  if (carga.tipo === "apagado") return null;
  return (
    <PanelTextoVista
      carga={carga}
      uiLocale={uiLocale}
      tiempo={tiempo}
      onSaltar={onSaltar}
      reducirMovimiento={reducirMovimiento}
      onReintentar={() => setIntento((valor) => valor + 1)}
    />
  );
}

/** Vista del panel. Sin red, para poder probarla. */
export function PanelTextoVista({
  carga,
  uiLocale,
  tiempo,
  onSaltar,
  reducirMovimiento,
  onReintentar,
}: {
  carga: Carga;
  uiLocale: string;
  tiempo: number;
  onSaltar: (segundo: number) => void;
  reducirMovimiento: boolean;
  onReintentar?: () => void;
}) {
  const tx = textosPanel(uiLocale);
  const lang = uiLocale === "en" ? "en" : "es";
  const { tamano, modo, cambiarTamano, alternarModo } = usePreferencias();
  const paleta = PALETA_TEXTO[modo];
  const listo = carga.tipo === "listo";
  return (
    <section
      id="letras"
      aria-label={tx.region}
      data-modo={modo}
      className="flex min-h-0 flex-col rounded-3xl border lg:h-full"
      style={{ background: paleta.fondo, color: paleta.tinta, borderColor: paleta.borde }}
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <h2 className="font-display text-2xl">{tx.titulo}</h2>
        {listo ? (
          <div className="flex items-center gap-1">
            <button type="button" aria-label={tx.menos} disabled={tamano === 0} onClick={() => cambiarTamano(-1)} className={`inline-flex size-11 items-center justify-center rounded-full text-base disabled:opacity-40 ${FOCO}`}>
              A−
            </button>
            <button type="button" aria-label={tx.mas} disabled={tamano === TAMANOS_TEXTO.length - 1} onClick={() => cambiarTamano(1)} className={`inline-flex size-11 items-center justify-center rounded-full text-xl disabled:opacity-40 ${FOCO}`}>
              A+
            </button>
            <button type="button" aria-pressed={modo === "dia"} onClick={alternarModo} className={`inline-flex min-h-11 items-center rounded-full border px-3 text-sm ${FOCO}`} style={{ borderColor: paleta.borde }}>
              {modo === "noche" ? tx.modoDia : tx.modoNoche}
            </button>
          </div>
        ) : null}
      </div>
      {carga.tipo === "listo" ? (
        <Lectura texto={carga.texto} tx={tx} tamano={tamano} modo={modo} tiempo={tiempo} onSaltar={onSaltar} reducirMovimiento={reducirMovimiento} />
      ) : (
        <div className="px-4 pt-2 pb-5" role={carga.tipo === "cargando" ? "status" : undefined}>
          {carga.tipo === "cargando" ? <p style={{ color: paleta.suave }}>{tx.cargando}</p> : null}
          {carga.tipo === "sin-texto" ? <p style={{ color: paleta.suave }}>{tx.sinTexto}</p> : null}
          {carga.tipo === "sin-sesion" ? (
            <>
              <p>{tx.sinSesion}</p>
              <Link href={destinoSiFalla(401, lang) ?? "/entrar"} className={`mt-3 inline-flex min-h-11 items-center rounded-full bg-[#C9A96E] px-5 text-[#100E0C] ${FOCO}`}>{tx.entrar}</Link>
            </>
          ) : null}
          {carga.tipo === "sin-permiso" ? (
            <>
              <p>{tx.sinPermiso}</p>
              <Link href={destinoSiFalla(403, lang) ?? "/membresia"} className={`mt-3 inline-flex min-h-11 items-center rounded-full bg-[#C9A96E] px-5 text-[#100E0C] ${FOCO}`}>{tx.prueba}</Link>
            </>
          ) : null}
          {carga.tipo === "error" ? (
            <>
              <p>{tx.error}</p>
              {onReintentar ? (
                <button type="button" onClick={onReintentar} className={`mt-3 inline-flex min-h-11 items-center rounded-full border px-5 ${FOCO}`} style={{ borderColor: paleta.borde }}>{tx.reintentar}</button>
              ) : null}
            </>
          ) : null}
        </div>
      )}
    </section>
  );
}

function Lectura({
  texto,
  tx,
  tamano,
  modo,
  tiempo,
  onSaltar,
  reducirMovimiento,
}: {
  texto: TextoEpisodio;
  tx: Textos;
  tamano: number;
  modo: ModoTexto;
  tiempo: number;
  onSaltar: (segundo: number) => void;
  reducirMovimiento: boolean;
}) {
  const paleta = PALETA_TEXTO[modo];
  const sincronizado = useMemo(() => estaSincronizado(texto.versiculos), [texto]);
  const marcas = useMemo(() => (sincronizado ? marcasDeTiempo(texto.versiculos) : []), [sincronizado, texto]);
  const actual = sincronizado ? versiculoActual(marcas, tiempo) : -1;
  const contenedor = useRef<HTMLDivElement>(null);
  const [pausado, setPausado] = useState(false);
  const temporizador = useRef<number | null>(null);

  useEffect(() => () => {
    if (temporizador.current != null) window.clearTimeout(temporizador.current);
  }, []);

  useEffect(() => {
    if (actual < 0 || pausado) return;
    const caja = contenedor.current;
    const fila = caja?.querySelector<HTMLElement>(`[data-indice="${actual}"]`);
    if (!caja || !fila || typeof caja.scrollTo !== "function") return;
    const destino = Math.max(0, fila.offsetTop - caja.clientHeight / 3);
    caja.scrollTo({ top: destino, behavior: reducirMovimiento || sistemaReduce() ? "auto" : "smooth" });
  }, [actual, pausado, reducirMovimiento]);

  function pausar() {
    if (!sincronizado) return;
    setPausado(true);
    if (temporizador.current != null) window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => setPausado(false), PAUSA_DESPLAZAMIENTO_MS);
  }

  function reanudar() {
    if (temporizador.current != null) window.clearTimeout(temporizador.current);
    setPausado(false);
  }

  return (
    <>
      {texto.muestra ? (
        <p role="note" className="mx-4 mt-2 rounded-xl border px-3 py-2 text-sm font-semibold" style={{ borderColor: paleta.numero, color: paleta.tinta }}>
          {tx.muestra}
        </p>
      ) : null}
      {sincronizado ? null : <p className="mx-4 mt-2 text-sm" style={{ color: paleta.suave }}>{tx.sinSincronia}</p>}
      <div
        ref={contenedor}
        tabIndex={0}
        aria-label={tx.region}
        aria-live="off"
        data-testid="texto-desplazable"
        className={`relative mt-2 max-h-[70dvh] min-h-0 overflow-y-auto overscroll-contain px-2 pb-4 lg:max-h-none lg:flex-1 ${FOCO}`}
        onWheel={pausar}
        onTouchMove={pausar}
        onKeyDown={(event) => {
          if (event.target === event.currentTarget && TECLAS_SCROLL.has(event.key)) pausar();
        }}
      >
        <ol className="space-y-1" style={{ fontSize: `${TAMANOS_TEXTO[tamano]}px`, lineHeight: 1.6 }}>
          {texto.versiculos.map((versiculo, indice) => {
            const esActual = indice === actual;
            const saltable = sincronizado && typeof versiculo.t === "number";
            const numero = <span aria-hidden="true" className="mr-2 align-top text-[0.7em] font-semibold tabular-nums" style={{ color: paleta.numero }}>{versiculo.v}</span>;
            return (
              <li
                key={`${versiculo.ref}-${indice}`}
                data-indice={indice}
                aria-current={esActual ? "true" : undefined}
                className="rounded-xl"
                style={{ background: esActual ? paleta.actual : undefined, color: esActual || !sincronizado ? paleta.tinta : paleta.suave }}
              >
                {saltable ? (
                  <button
                    type="button"
                    onClick={() => onSaltar(versiculo.t as number)}
                    className={`block min-h-11 w-full cursor-pointer rounded-xl px-3 py-2 text-left ${FOCO}`}
                  >
                    <span className="sr-only">{tx.saltar(versiculo.v)}. </span>
                    {numero}
                    {versiculo.texto}
                  </button>
                ) : (
                  <p className="px-3 py-2">
                    <span className="sr-only">{tx.versiculo} {versiculo.v}. </span>
                    {numero}
                    {versiculo.texto}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      {pausado && actual >= 0 ? (
        <div className="px-4 pt-1">
          <button type="button" onClick={reanudar} className={`inline-flex min-h-11 items-center rounded-full bg-[#C9A96E] px-4 text-sm text-[#100E0C] ${FOCO}`}>
            {tx.volver}
          </button>
        </div>
      ) : null}
      <p className="px-4 pt-2 pb-4 text-xs" style={{ color: paleta.suave }}>
        {texto.fuente}. {texto.credito}
      </p>
    </>
  );
}
