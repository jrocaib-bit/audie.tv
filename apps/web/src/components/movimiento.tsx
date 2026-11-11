"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { coincideLibro } from "@/lib/movimiento";

const CLAVE = "audite.barra";

export function CompactarCabecera() {
  useEffect(() => {
    const cabecera = document.querySelector<HTMLElement>("[data-cabecera]");
    if (!cabecera) return;
    const aplicar = () => cabecera.toggleAttribute("data-compacta", window.scrollY > 28);
    aplicar();
    window.addEventListener("scroll", aplicar, { passive: true });
    return () => window.removeEventListener("scroll", aplicar);
  }, []);
  return null;
}

export function EnlaceTransicion({ href, nombre, className, children }: { href: string; nombre: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  const ir = (evento: MouseEvent<HTMLAnchorElement>) => {
    if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey || evento.button !== 0) return;
    const vista = document as Document & { startViewTransition?: (cambio: () => void) => void };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !vista.startViewTransition) return;
    evento.preventDefault();
    vista.startViewTransition(() => {
      router.push(href);
    });
  };
  return (
    <a href={href} className={className} style={{ viewTransitionName: nombre }} onClick={ir}>
      {children}
    </a>
  );
}

export function FiltroCatalogo({ etiqueta, todos, antiguo, nuevo, buscar, children }: { etiqueta: string; todos: string; antiguo: string; nuevo: string; buscar: string; children: ReactNode }) {
  const [tab, setTab] = useState<"todos" | "at" | "nt">("todos");
  const [texto, setTexto] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const base = useId();
  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
    raiz.querySelectorAll<HTMLElement>("[data-libro]").forEach((tarjeta) => {
      const nombre = tarjeta.dataset.nombre ?? "";
      const testamento = tarjeta.dataset.testamento;
      const visible = coincideLibro(nombre, texto) && (tab === "todos" || testamento === tab);
      tarjeta.hidden = !visible;
    });
    raiz.querySelectorAll<HTMLElement>("[data-bloque]").forEach((bloque) => {
      const alguna = [...bloque.querySelectorAll<HTMLElement>("[data-libro]")].some((tarjeta) => !tarjeta.hidden);
      bloque.hidden = !alguna;
    });
  }, [tab, texto]);
  const elegir = (siguiente: "todos" | "at" | "nt") => setTab(siguiente);
  return (
    <div ref={ref}>
      <div className="mt-8 flex flex-wrap items-end gap-6">
        <div className="relative flex gap-4" role="tablist" aria-label={etiqueta} onKeyDown={(evento) => {
          const orden = ["todos", "at", "nt"] as const;
          const actual = orden.indexOf(tab);
          if (evento.key === "ArrowRight") elegir(orden[(actual + 1) % orden.length] ?? "todos");
          if (evento.key === "ArrowLeft") elegir(orden[(actual + 2) % orden.length] ?? "todos");
        }}>
          {([["todos", todos], ["at", antiguo], ["nt", nuevo]] as const).map(([id, rotulo]) => (
            <button key={id} id={`${base}-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`${base}-panel`} className={`boton min-h-11 border-b px-1 text-sm text-[#F4ECE2] ${tab === id ? "border-[#C9A96E]" : "border-transparent"}`} onClick={() => elegir(id)}>
              {rotulo}
            </button>
          ))}
          <span className="indicador-tab" hidden />
        </div>
        <label className="text-sm text-[#B7AB9C]">
          {buscar}
          <input value={texto} onChange={(evento) => setTexto(evento.target.value)} className="mt-1 block min-h-11 rounded-full border border-[#2E2924] bg-transparent px-4 text-[#F4ECE2]" />
        </label>
      </div>
      <div id={`${base}-panel`} role="tabpanel">{children}</div>
    </div>
  );
}

export function BotonEscucha({ href, id, titulo, etiqueta }: { href: string; id: string; titulo: string; etiqueta: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <a
      href={href}
      className={abierto ? "boton-escucha abierto" : "boton-escucha boton"}
      onClick={(evento) => {
        if (abierto) {
          sessionStorage.setItem(CLAVE, JSON.stringify({ id, titulo, href }));
          window.dispatchEvent(new Event("audite-barra"));
          return;
        }
        evento.preventDefault();
        setAbierto(true);
        sessionStorage.setItem(CLAVE, JSON.stringify({ id, titulo, href }));
        window.dispatchEvent(new Event("audite-barra"));
      }}
    >
      <span>{abierto ? titulo : etiqueta}</span>
      <span className="onda" aria-hidden="true"><i /><i /><i /><i /></span>
      {abierto ? <span className="pista" aria-hidden="true"><span className="avance" /></span> : null}
    </a>
  );
}

export function BarraPersistente() {
  const [barra, setBarra] = useState<{ id: string; titulo: string; href: string } | null>(null);
  useEffect(() => {
    const leer = () => {
      try {
        const crudo = sessionStorage.getItem(CLAVE);
        setBarra(crudo ? JSON.parse(crudo) as { id: string; titulo: string; href: string } : null);
      } catch {
        setBarra(null);
      }
    };
    leer();
    window.addEventListener("audite-barra", leer);
    return () => window.removeEventListener("audite-barra", leer);
  }, []);
  if (!barra) return null;
  return (
    <a href={barra.href} className="barra-fija">
      <span className="onda" aria-hidden="true"><i /><i /><i /><i /></span>
      <span className="min-w-0 flex-1 truncate">{barra.titulo}</span>
      <span className="pista" aria-hidden="true"><span className="avance" /></span>
    </a>
  );
}
