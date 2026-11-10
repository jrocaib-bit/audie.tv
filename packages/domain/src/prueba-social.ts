/** Solo cuentas reales: episodios del manifiesto, obras y idiomas. */
export function pruebaSocial(datos: { episodios: number; obras: number; idiomas: number }, idioma: string): string {
  const es = idioma !== "en";
  const episodios = es ? "episodios" : "episodes";
  const obras = es ? "obras" : "works";
  const idiomas = es ? "idiomas" : "languages";
  return `${datos.episodios} ${episodios} · ${datos.obras} ${obras} · ${datos.idiomas} ${idiomas}`;
}
