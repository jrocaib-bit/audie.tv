"use client";

import { CLAVE_MARCADORES, añadirALista, crearLista, portadaLista, reordenarLista, type ListaUsuario } from "@audite/domain";
import Link from "next/link";
import { useSyncExternalStore, useState } from "react";
import { useLibrary } from "@/components/library";
import { Arte } from "@/components/v2/fichas";

const CLAVE = "audite.listas.v1";
const vacio: ListaUsuario[] = [];
let listas: ListaUsuario[] = vacio;
let listo = false;
const oyentes = new Set<() => void>();

function leer(): ListaUsuario[] {
  if (!listo && typeof localStorage !== "undefined") {
    listo = true;
    try {
      const raw = JSON.parse(localStorage.getItem(CLAVE) || "[]") as ListaUsuario[];
      listas = Array.isArray(raw) ? raw : [];
    } catch {
      listas = [];
    }
  }
  return listas;
}

function publicar(siguiente: ListaUsuario[]) {
  listas = siguiente;
  localStorage.setItem(CLAVE, JSON.stringify(siguiente));
  oyentes.forEach((oyente) => oyente());
}

export function ListasV2({ id }: { id?: string }) {
  const { settings, catalog } = useLibrary();
  const es = settings.uiLocale === "es";
  const actual = useSyncExternalStore((avisar) => { oyentes.add(avisar); return () => oyentes.delete(avisar); }, leer, () => vacio);
  const [nombre, setNombre] = useState("");
  const lista = actual.find((item) => item.id === id);

  if (lista) {
    const portada = portadaLista(lista);
    return (
      <main id="contenido" className="app-clear px-4 pt-4">
        <div className="grid grid-cols-2 overflow-hidden rounded-3xl">
          {[0, 1, 2, 3].map((indice) => <Arte key={indice} episodioId={portada[indice] ?? null} className="aspect-square w-full" />)}
        </div>
        <h1 className="font-display mt-4 text-4xl leading-none">{lista.nombre}</h1>
        <ul className="mt-4">
          {lista.items.map((item, indice) => (
            <li key={item.episodeId} className="flex min-h-14 items-center justify-between gap-3 border-b border-border">
              <Link href={`/ahora?e=${item.episodeId}`} className="font-display text-xl">{catalog.books.find((libro) => item.episodeId.startsWith(`${libro.id}-`))?.name[settings.uiLocale] || item.episodeId}</Link>
              <span className="flex gap-2">
                <button type="button" className="min-h-11 px-2" onClick={() => publicar(actual.map((itemLista) => itemLista.id === lista.id ? reordenarLista(itemLista, indice, indice - 1) : itemLista))}>↑</button>
                <button type="button" className="min-h-11 px-2" onClick={() => publicar(actual.map((itemLista) => itemLista.id === lista.id ? reordenarLista(itemLista, indice, indice + 1) : itemLista))}>↓</button>
              </span>
            </li>
          ))}
        </ul>
        <button type="button" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-acento px-4 text-acento-ink" onClick={() => {
          const primero = catalog.episodes[0]?.id ?? "gn-01";
          publicar(actual.map((itemLista) => itemLista.id === lista.id ? añadirALista(itemLista, primero, new Date().toISOString()) : itemLista));
        }}>{es ? "Añadir" : "Add"}</button>
      </main>
    );
  }

  return (
    <main id="contenido" className="app-clear px-4 pt-4">
      <h1 className="font-display text-4xl leading-none">{es ? "Mis pasajes" : "My passages"}</h1>
      <form className="mt-4 flex gap-2" onSubmit={(event) => {
        event.preventDefault();
        const creada = crearLista(nombre, new Date().toISOString(), `l-${Date.now()}`);
        if (!creada) return;
        publicar([creada, ...actual]);
        setNombre("");
      }}>
        <input value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder={es ? "Nueva lista" : "New list"} className="neo-card min-h-12 min-w-0 flex-1 bg-transparent px-4 outline-none" />
        <button type="submit" className="min-h-12 shrink-0 rounded-full bg-acento px-4 text-acento-ink">{es ? "Crear" : "Create"}</button>
      </form>
      <ul className="mt-4">
        {actual.map((item) => (
          <li key={item.id}><Link href={`/listas/${item.id}`} className="flex min-h-16 items-center gap-3"><span className="grid size-14 grid-cols-2 overflow-hidden rounded-xl">{portadaLista(item).concat(["", "", "", ""]).slice(0, 4).map((episodio, indice) => <Arte key={indice} episodioId={episodio || null} className="h-7 w-7" />)}</span><span className="font-display text-2xl">{item.nombre}</span></Link></li>
        ))}
      </ul>
      <p className="sr-only">{CLAVE_MARCADORES}</p>
    </main>
  );
}
