"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sesionWeb, supabaseWeb } from "@/lib/auth-web";
import type { ModeloReto } from "@/lib/reto-vista";
import { guardarVuelta, hrefEntrar } from "@/lib/vuelta";
import { ProbarAudio, useProbar, type CambioAudio } from "@/components/probar";

function Play() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor" />
    </svg>
  );
}

async function guardarProgreso(evento: CambioAudio): Promise<boolean> {
  try {
    const remoto = supabaseWeb();
    const userId = (await remoto?.auth.getSession())?.data.session?.user.id;
    if (!remoto || !userId) return false;
    await remoto.from("listening_progress").upsert({
      user_id: userId,
      episode_id: evento.id,
      position_seconds: Math.max(0, Math.round(evento.segundo)),
      completed: evento.fin,
      updated_at: new Date().toISOString(),
    });
    if (!evento.fin) return false;
    const dia = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    await remoto.from("listening_days").insert({ user_id: userId, day: dia });
    return true;
  } catch {
    return evento.fin;
  }
}

function Cuerpo({ lang, modelo, hechos, sumar }: { lang: "es" | "en"; modelo: ModeloReto; hechos: ReadonlySet<string>; sumar: (id: string) => void }) {
  const router = useRouter();
  const probar = useProbar();
  const [cuenta, setCuenta] = useState<boolean | null>(null);
  const en = lang === "en";
  const completos = modelo.dias.filter((dia) => dia.episodio && hechos.has(dia.episodio)).length;

  const sumarRef = useRef(sumar);
  useEffect(() => {
    sumarRef.current = sumar;
  });
  useEffect(() => {
    let vivo = true;
    void (async () => {
      const remoto = supabaseWeb();
      const sesion = await remoto?.auth.getSession();
      const userId = sesion?.data.session?.user.id;
      if (!vivo) return;
      setCuenta(Boolean(userId));
      if (!remoto || !userId) return;
      const { data } = await remoto.from("listening_progress").select("episode_id").eq("user_id", userId).eq("completed", true);
      if (!vivo || !data) return;
      for (const fila of data) {
        if (typeof fila.episode_id === "string") sumarRef.current(fila.episode_id);
      }
    })();
    return () => { vivo = false; };
  }, []);

  async function querer(episodio: string, titulo: string) {
    const sesion = await sesionWeb();
    if (!sesion) {
      const ruta = `/${lang}/retos/${modelo.id}`;
      guardarVuelta(ruta, episodio);
      router.push(hrefEntrar(lang, ruta, episodio));
      return;
    }
    setCuenta(true);
    probar?.reproducir({ id: episodio, titulo });
  }

  return (
    <main className="bg-[#100E0C] pb-28 text-[#F4ECE2]">
      <div className="relative min-h-[78svh] overflow-hidden bg-[#1B1815]">
        {modelo.portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={modelo.portada} alt="" className="ken-burns absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/45 to-[#100E0C]/10" />
        <div className="relative z-10 flex min-h-[78svh] flex-col justify-end px-5 pt-28 pb-8 md:px-8">
          <h1 className="font-display max-w-4xl text-[clamp(2.6rem,7vw,5.4rem)] leading-[0.95]">{modelo.titulo}</h1>
          {cuenta ? (
            <p className="mt-4 font-display text-3xl leading-none text-[#C9A96E]">
              <span className="tabular-nums">{completos}</span>
              <span className="text-xl text-[#F4ECE2]">/{modelo.dias.length}</span>
            </p>
          ) : null}
          {modelo.empezar ? (
            <button type="button" className="boton mt-6 inline-flex min-h-12 w-fit items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]" onClick={() => void querer(modelo.empezar!, modelo.dias.find((dia) => dia.episodio === modelo.empezar)?.titulo ?? modelo.titulo)}>
              {en ? "Start the challenge" : "Empieza el reto"}
            </button>
          ) : null}
        </div>
      </div>
      <ol className="mx-auto w-full max-w-3xl px-5 md:px-8">
        {modelo.dias.map((dia) => {
          const meta = [dia.cuando, dia.cita].filter(Boolean).join(" · ");
          const sonando = Boolean(dia.episodio && probar?.id === dia.episodio && probar.sonando);
          return (
            <li key={`${modelo.id}-${dia.numero}`} className={`dia-reto aparecer flex items-center gap-3 border-b border-[#2E2924] py-3 ${dia.hoy ? "dia-hoy" : ""}`} style={{ ["--i" as string]: dia.numero % 12 }} aria-current={dia.hoy ? "date" : undefined}>
              <span className="size-14 shrink-0 overflow-hidden rounded-md bg-[#1B1815]">
                {dia.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dia.src} alt="" className="h-full w-full object-cover" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg leading-tight">{dia.numero}. {dia.titulo}</span>
                <span className="mt-1 block text-sm text-[#C9A96E]">{meta}</span>
              </span>
              {dia.audio && dia.episodio ? (
                <button type="button" className="boton inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#C9A96E] text-[#100E0C]" aria-label={dia.titulo} aria-pressed={sonando} data-episodio={dia.episodio} data-titulo={dia.titulo} onClick={() => void querer(dia.episodio!, dia.titulo)}>
                  {sonando ? <span className="onda" aria-hidden="true"><i /><i /><i /><i /></span> : <Play />}
                </button>
              ) : (
                <span className="shrink-0 text-sm text-[#8A8175]">{en ? "Coming soon" : "Próximamente"}</span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mx-auto w-full max-w-3xl px-5 py-8 md:px-8">
        <Link href={`/${lang}/retos`} className="inline-flex min-h-11 items-center text-sm text-[#C9A96E] underline">{en ? "All challenges" : "Todos los retos"}</Link>
      </div>
    </main>
  );
}

export function RetoEscucha({ lang, modelo }: { lang: string; modelo: ModeloReto }) {
  const ui = lang === "en" ? "en" : "es";
  const [hechos, setHechos] = useState<string[]>([]);
  const sumar = (id: string) => setHechos((previo) => previo.includes(id) ? previo : [...previo, id]);
  return (
    <ProbarAudio onCambio={(evento) => {
      void guardarProgreso(evento).then((completo) => { if (completo) sumar(evento.id); });
    }}>
      <Cuerpo lang={ui} modelo={modelo} hechos={new Set(hechos)} sumar={sumar} />
    </ProbarAudio>
  );
}
