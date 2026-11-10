/** Episodios del manifiesto, idiomas y, si hay recuento, las obras que la app muestra. */
export function pruebaSocial(datos: { episodios: number; obras?: number | null; idiomas: number }, idioma: string): string {
  const es = idioma !== "en";
  const partes = [`${datos.episodios} ${es ? "episodios" : "episodes"}`];
  if (typeof datos.obras === "number" && Number.isFinite(datos.obras) && datos.obras > 0) {
    partes.push(`${datos.obras} ${es ? "obras" : "works"}`);
  }
  partes.push(`${datos.idiomas} ${es ? "idiomas" : "languages"}`);
  return partes.join(" · ");
}
