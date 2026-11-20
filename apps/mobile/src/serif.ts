/** Sin Gazpacho, la serif que ya trae el sistema. No se incrusta Georgia. */
export function familiaSerif(hayGazpacho: boolean, os: string): string {
  if (hayGazpacho) return "Gazpacho";
  return os === "android" ? "serif" : "Times New Roman";
}
