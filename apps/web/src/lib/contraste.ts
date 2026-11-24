/** Contraste WCAG 2.x entre dos colores #rrggbb (sin alfa). AA: 4,5:1 texto normal, 3:1 texto grande. */
function canal(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
export function luminancia(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
}
export function ratioContraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}
/** Mezcla `frente` con opacidad `alfa` sobre `fondo` (para colores tipo #F4ECE2/90). */
export function mezcla(frente: string, fondo: string, alfa: number): string {
  const f = parseInt(frente.replace("#", ""), 16);
  const g = parseInt(fondo.replace("#", ""), 16);
  const c = (s: number) => Math.round(((f >> s) & 255) * alfa + ((g >> s) & 255) * (1 - alfa));
  return `#${[16, 8, 0].map((s) => c(s).toString(16).padStart(2, "0")).join("")}`;
}
