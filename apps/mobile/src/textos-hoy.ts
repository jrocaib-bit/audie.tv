type Idioma = "es" | "en";

const es = {
  // Hoy
  kickerHoy: "Tu episodio de hoy",
  miCamino: "Mi camino",
  dia: "Día {n} de {total}",
  escuchar: "Escuchar",
  seguir: "Seguir escuchando",
  pausar: "Pausar",
  sinAudioTitulo: "Este episodio no tiene audio disponible",
  sinAudioCuerpo: "Elige otro camino con audio disponible.",
  completoTitulo: "Has completado este camino",
  completoCuerpo: "Elige otro camino para seguir escuchando.",
  elegirOtro: "Elegir otro camino",
  verCamino: "Ver mi camino",
  continuarTitulo: "Continuar donde lo dejé",
  retoActivo: "Reto activo",
  retoProximo: "Próximo reto",
  retoTerminado: "Último reto",
  retoEmpieza: "Empieza en {n} días",
  retoEmpiezaUno: "Empieza mañana",
  retoDias: "{h} de {t} días",
  retoNota: "Hoy se sigue aquí el reto de Adviento. Los demás están en Retos.",
  todosRetos: "Todos los retos",
  historias: "Historias de la Biblia",
  historiasNota: "Episodios con audio para escuchar ahora.",
  verTodas: "Ver todas",
  // Caminos
  caminosIntro: "Un recorrido guiado para escuchar la Biblia a un episodio por día. Elige uno y sigue tu avance en Hoy.",
  elegirTitulo: "Elegir otro camino",
  siguiente: "Siguiente episodio",
  siguienteSinAudio: "El siguiente episodio no tiene audio disponible.",
  caminoCompleto: "Has escuchado todos los episodios de este camino.",
  volverHoy: "Volver a Hoy",
  elegir: "Elegir este camino",
  audioTodo: "Todos los episodios tienen audio",
  audioParte: "{n} episodios con audio",
  audioNada: "Este camino no tiene episodios con audio disponible",
  escuchados: "{h} de {t} episodios escuchados",
  cambio: "Tu camino ahora es {nombre}. Tu avance se conserva.",
};

const en: typeof es = {
  kickerHoy: "Your episode for today",
  miCamino: "My path",
  dia: "Day {n} of {total}",
  escuchar: "Listen",
  seguir: "Keep listening",
  pausar: "Pause",
  sinAudioTitulo: "This episode has no audio available",
  sinAudioCuerpo: "Choose another path with audio available.",
  completoTitulo: "You have completed this path",
  completoCuerpo: "Choose another path to keep listening.",
  elegirOtro: "Choose another path",
  verCamino: "View my path",
  continuarTitulo: "Continue where you left off",
  retoActivo: "Active challenge",
  retoProximo: "Next challenge",
  retoTerminado: "Latest challenge",
  retoEmpieza: "Starts in {n} days",
  retoEmpiezaUno: "Starts tomorrow",
  retoDias: "{h} of {t} days",
  retoNota: "Advent is the challenge followed here. The others are in Challenges.",
  todosRetos: "All challenges",
  historias: "Stories from the Bible",
  historiasNota: "Episodes with audio to hear now.",
  verTodas: "See all",
  caminosIntro: "A guided route to hear the Bible one episode a day. Pick one and follow your progress in Today.",
  elegirTitulo: "Choose another path",
  siguiente: "Next episode",
  siguienteSinAudio: "The next episode has no audio available.",
  caminoCompleto: "You have heard every episode on this path.",
  volverHoy: "Back to Today",
  elegir: "Choose this path",
  audioTodo: "Every episode has audio",
  audioParte: "{n} episodes with audio",
  audioNada: "This path has no episodes with audio available",
  escuchados: "{h} of {t} episodes heard",
  cambio: "Your path is now {nombre}. Your progress is kept.",
};

export function th(lang: Idioma) {
  return lang === "en" ? en : es;
}

export function llenar(plantilla: string, valores: Record<string, string | number>): string {
  return plantilla.replace(/\{(\w+)\}/g, (_, k: string) => String(valores[k] ?? ""));
}
