"use client";

import { decidirEscucha, estadoEscuchaVacio } from "@audite/domain";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useLibrary } from "@/components/library";
import { medir } from "@/lib/medicion";

export function MedicionRuta() {
  const pathname = usePathname();
  useEffect(() => {
    medir("page_view", { path: pathname });
  }, [pathname]);
  return null;
}

export function MedicionEscucha() {
  const { player } = useLibrary();
  const estado = useRef(estadoEscuchaVacio());
  useEffect(() => {
    const fraccion = player.duration > 0 ? player.globalTime / player.duration : 0;
    const decision = decidirEscucha(estado.current, { episodeId: player.episodeId, status: player.status, fraccion });
    estado.current = decision.estado;
    for (const evento of decision.eventos) {
      if (evento.nombre === "playback_progress" && evento.marca) medir("playback_progress", { episode_id: evento.episode_id, marca: evento.marca });
      if (evento.nombre === "playback_started") medir("playback_started", { episode_id: evento.episode_id });
      if (evento.nombre === "episode_completed") medir("episode_completed", { episode_id: evento.episode_id });
    }
  }, [player.duration, player.episodeId, player.globalTime, player.status]);
  return null;
}
