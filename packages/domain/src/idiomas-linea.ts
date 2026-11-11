const LINEA: Record<string, string> = {
  es: "Disponible en español; más idiomas pronto.",
  en: "Available in Spanish; more languages soon.",
  it: "Disponibile in spagnolo; altre lingue presto.",
  pt: "Disponível em espanhol; mais línguas em breve.",
  fr: "Disponible en espagnol ; d'autres langues bientôt.",
  de: "Auf Spanisch verfügbar; weitere Sprachen bald.",
  zh: "目前提供西班牙语；更多语言即将推出。",
};

export function lineaIdiomas(idioma: string): string {
  return LINEA[idioma] ?? LINEA.es!;
}
