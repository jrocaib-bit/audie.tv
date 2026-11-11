function correoDe(valor: string): string {
  const limpio = valor.trim().toLowerCase();
  const angulo = limpio.match(/<([^>]+)>/);
  return (angulo?.[1] ?? limpio).trim();
}

export function entradasPermitidas(valor: string | undefined): string[] {
  return (valor ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
}

export function destinatarioPermitido(direccion: string, permitidos: readonly string[]): boolean {
  const correo = correoDe(direccion);
  const arroba = correo.lastIndexOf("@");
  if (arroba < 1) return false;
  const dominio = correo.slice(arroba);
  return permitidos.some((item) => (item.startsWith("@") ? dominio === item : correo === item));
}

export function decisionEnvio(entrada: {
  envioReal: boolean;
  permitidos: string | undefined;
  produccion: boolean;
  destinatarios: { to?: string | string[]; cc?: string | string[]; bcc?: string | string[] };
}): "enviar" | "no_enviar" | "bloqueado" {
  if (!entrada.envioReal) return "no_enviar";
  const lista = entradasPermitidas(entrada.permitidos);
  if (lista.length === 0) return entrada.produccion ? "enviar" : "bloqueado";
  const todos = [entrada.destinatarios.to, entrada.destinatarios.cc, entrada.destinatarios.bcc]
    .flatMap((valor) => (valor == null ? [] : Array.isArray(valor) ? valor : [valor]))
    .map(correoDe)
    .filter(Boolean);
  if (todos.length === 0 || todos.some((correo) => !destinatarioPermitido(correo, lista))) return "bloqueado";
  return "enviar";
}

export function avisoBloqueo(correo: string): string {
  return JSON.stringify({ correo, motivo: "bloqueado_por_lista" });
}
