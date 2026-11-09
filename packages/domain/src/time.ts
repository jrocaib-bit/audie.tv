const VERSOS_GENESIS = [31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26];

/** Posición de capítulo y versículo dentro de un rango, sin el texto del versículo. */
export function citaEnCurso(etiqueta: string, fraccion: number): string | null {
  const match = /(\d+)\s*:\s*(\d+)\s*[–-]\s*(\d+)\s*:\s*(\d+)/.exec(etiqueta);
  if (!match) return null;
  const inicioCapitulo = Number(match[1]);
  const inicioVerso = Number(match[2]);
  const finCapitulo = Number(match[3]);
  const finVerso = Number(match[4]);
  const puntos: string[] = [];
  for (let capitulo = inicioCapitulo; capitulo <= finCapitulo; capitulo += 1) {
    const total = VERSOS_GENESIS[capitulo - 1];
    if (!total) return null;
    const desde = capitulo === inicioCapitulo ? inicioVerso : 1;
    const hasta = capitulo === finCapitulo ? Math.min(finVerso, total) : total;
    for (let verso = desde; verso <= hasta; verso += 1) puntos.push(`${capitulo}:${verso}`);
  }
  if (puntos.length === 0) return null;
  const avance = Number.isFinite(fraccion) ? Math.min(1, Math.max(0, fraccion)) : 0;
  const indice = Math.min(puntos.length - 1, Math.floor(avance * (puntos.length - 1)));
  return puntos[indice] ?? null;
}

export function segundoDeCita(etiqueta: string, cita: string, duracion: number): number | null {
  const match = /(\d+)\s*:\s*(\d+)\s*[–-]\s*(\d+)\s*:\s*(\d+)/.exec(etiqueta);
  const destino = /^(\d+)\s*:\s*(\d+)$/.exec(cita.trim());
  if (!match || !destino || duracion <= 0) return null;
  const inicioCapitulo = Number(match[1]);
  const inicioVerso = Number(match[2]);
  const finCapitulo = Number(match[3]);
  const finVerso = Number(match[4]);
  const puntos: string[] = [];
  for (let capitulo = inicioCapitulo; capitulo <= finCapitulo; capitulo += 1) {
    const total = VERSOS_GENESIS[capitulo - 1];
    if (!total) return null;
    const desde = capitulo === inicioCapitulo ? inicioVerso : 1;
    const hasta = capitulo === finCapitulo ? Math.min(finVerso, total) : total;
    for (let verso = desde; verso <= hasta; verso += 1) puntos.push(`${capitulo}:${verso}`);
  }
  const indice = puntos.indexOf(`${Number(destino[1])}:${Number(destino[2])}`);
  if (indice < 0 || puntos.length < 2) return null;
  return (indice / (puntos.length - 1)) * duracion;
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

export function formatClock(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const total = Math.floor(safe + 1e-4);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remain = total % 60;
  const ss = remain.toString().padStart(2, "0");
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${ss}`;
  return `${minutes}:${ss}`;
}

export function formatSpokenDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const remain = total % 60;
  if (remain === 0) return `${minutes} min`;
  return `${minutes} min ${remain} s`;
}
