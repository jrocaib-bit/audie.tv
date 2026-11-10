export function fechaDeCuando(cuando: string | null | undefined): Date {
  if (cuando && /^\d{4}-\d{2}-\d{2}$/.test(cuando)) {
    const [anio, mes, dia] = cuando.split("-").map(Number);
    return new Date(anio ?? 1970, (mes ?? 1) - 1, dia ?? 1, 16);
  }
  return new Date();
}

export function isoLocal(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}
