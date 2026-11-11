import { esPortadaProvisional } from "@audite/content/obras";
import { tituloDeEpisodio } from "@/components/portada-marca";

export function GET(_solicitud: Request, contexto: { params: Promise<{ id: string }> }) {
  return contexto.params.then(({ id }) => {
    if (!esPortadaProvisional(id)) return new Response(null, { status: 404 });
    const titulo = escapar(tituloDeEpisodio(id, "es"));
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
  <rect width="1200" height="1500" fill="#100E0C"/>
  <radialGradient id="oro" cx="50%" cy="18%" r="62%">
    <stop offset="0%" stop-color="#C9A96E" stop-opacity="0.34"/>
    <stop offset="100%" stop-color="#C9A96E" stop-opacity="0"/>
  </radialGradient>
  <rect width="1200" height="1500" fill="url(#oro)"/>
  <circle cx="600" cy="620" r="54" fill="none" stroke="#C9A96E" stroke-width="6"/>
  <text x="600" y="638" text-anchor="middle" fill="#C9A96E" font-family="Georgia, serif" font-size="42">A</text>
  <text x="600" y="820" text-anchor="middle" fill="#F4ECE2" font-family="Gazpacho, Georgia, serif" font-size="64">${titulo}</text>
</svg>`;
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  });
}

function escapar(texto: string): string {
  return texto.replace(/[&<>"]/g, (letra) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[letra] ?? letra);
}
