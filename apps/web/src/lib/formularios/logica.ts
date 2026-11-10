import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const POLITICA_VERSION = "2026-11-10";
export const ESPERA_MS = 3000;
export const TOKEN_DIAS = 7;
export const TOPE_IP_HORA = 5;
export const TOPE_CORREO_DIA = 3;

export type ListaCorreo = "boletin" | "lanzamiento_app";
export type EstadoLista = "pendiente" | "confirmada" | "baja";

export type FilaLista = {
  email: string;
  lista: ListaCorreo;
  estado: EstadoLista;
  tokenHash: string;
  expira: number;
  plataforma: "ios" | "android" | "ambas" | null;
};

export type VentanaLimite = { clave: string; periodo: "hora" | "dia"; inicio: number; cuenta: number };

export function correoNormalizado(valor: string): string {
  return valor.trim().toLowerCase();
}

export function correoValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado(valor));
}

export function hashSecreto(valor: string, sal: string): string {
  return createHash("sha256").update(`${sal}:${valor}`).digest("hex");
}

export function firmarMarca(ahora: number, sal: string): string {
  const mac = createHmac("sha256", sal).update(String(ahora)).digest("hex");
  return `${ahora}.${mac}`;
}

export function marcaAceptada(firma: string, sal: string, ahora: number, espera = ESPERA_MS): boolean {
  const [crudo, mac] = firma.split(".");
  const momento = Number(crudo);
  if (!crudo || !mac || !Number.isFinite(momento)) return false;
  const esperada = createHmac("sha256", sal).update(String(momento)).digest("hex");
  const a = Buffer.from(mac);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  if (ahora - momento < espera) return false;
  if (ahora - momento > 2 * 60 * 60 * 1000) return false;
  return true;
}

export function crearToken(ahora = Date.now(), sal = "sal"): { token: string; hash: string; expira: number } {
  const token = randomBytes(24).toString("base64url");
  return { token, hash: hashSecreto(token, sal), expira: ahora + TOKEN_DIAS * 86400000 };
}

export type Trampa = "aceptado" | "descartado" | "invalido" | "limite";

export function decidirEnvio(entrada: { miel: string; firma: string; sal: string; ahora: number; permitido: boolean; valido: boolean }): Trampa {
  if (entrada.miel.trim()) return "descartado";
  if (!marcaAceptada(entrada.firma, entrada.sal, entrada.ahora)) return "descartado";
  if (!entrada.valido) return "invalido";
  if (!entrada.permitido) return "limite";
  return "aceptado";
}

export function inicioHora(ms: number): number {
  return Math.floor(ms / 3600000) * 3600000;
}

export function inicioDia(ms: number): number {
  const fecha = new Date(ms);
  return Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate());
}

export function consumirLimite(ventanas: VentanaLimite[], ipHash: string, email: string, ahora: number): { permitido: boolean; ventanas: VentanaLimite[] } {
  const copia = ventanas.map((item) => ({ ...item }));
  const pedidos = [
    { clave: `ip:${ipHash}`, periodo: "hora" as const, inicio: inicioHora(ahora), tope: TOPE_IP_HORA },
    { clave: `correo:${correoNormalizado(email)}`, periodo: "dia" as const, inicio: inicioDia(ahora), tope: TOPE_CORREO_DIA },
  ];
  for (const pedido of pedidos) {
    const actual = copia.find((item) => item.clave === pedido.clave && item.periodo === pedido.periodo && item.inicio === pedido.inicio);
    if ((actual?.cuenta ?? 0) >= pedido.tope) return { permitido: false, ventanas };
  }
  for (const pedido of pedidos) {
    const actual = copia.find((item) => item.clave === pedido.clave && item.periodo === pedido.periodo && item.inicio === pedido.inicio);
    if (actual) actual.cuenta += 1;
    else copia.push({ clave: pedido.clave, periodo: pedido.periodo, inicio: pedido.inicio, cuenta: 1 });
  }
  return { permitido: true, ventanas: copia };
}

export function apuntarLista(filas: FilaLista[], fila: Omit<FilaLista, "estado" | "tokenHash" | "expira">, token: { hash: string; expira: number }): { filas: FilaLista[]; silencio: true } {
  const email = correoNormalizado(fila.email);
  const previa = filas.find((item) => item.email === email && item.lista === fila.lista && item.estado === "confirmada");
  if (previa) return { filas, silencio: true };
  const resto = filas.filter((item) => !(item.email === email && item.lista === fila.lista && item.estado === "pendiente"));
  resto.push({ ...fila, email, estado: "pendiente", tokenHash: token.hash, expira: token.expira });
  return { filas: resto, silencio: true };
}

export function confirmarToken(filas: FilaLista[], token: string, ahora: number, sal: string): { filas: FilaLista[]; resultado: "ok" | "caducado" | "desconocido" } {
  const hash = hashSecreto(token, sal);
  const indice = filas.findIndex((item) => item.tokenHash === hash);
  const fila = indice >= 0 ? filas[indice] : undefined;
  if (!fila) return { filas, resultado: "desconocido" };
  if (fila.estado === "confirmada") return { filas, resultado: "ok" };
  if (fila.expira < ahora || fila.estado === "baja") return { filas, resultado: "caducado" };
  const copia = filas.slice();
  copia[indice] = { ...fila, estado: "confirmada" };
  return { filas: copia, resultado: "ok" };
}

export function darDeBaja(filas: FilaLista[], token: string, sal: string): FilaLista[] {
  const hash = hashSecreto(token, sal);
  return filas.map((item) => item.tokenHash === hash ? { ...item, estado: "baja" } : item);
}

export function debeEnviarCorreo(marca = process.env.CORREO_ENVIO_REAL): boolean {
  return marca === "true";
}

export const MENSAJE_LISTA = "Listo. Te hemos enviado un correo para que confirmes la suscripción. Si no lo ves, mira en correo no deseado (sale desde no-reply@audite.tv).";
export const MENSAJE_CONTACTO_OK = "Gracias. Hemos recibido tu mensaje. Te responderemos a tu correo. Si quieres, puedes seguir mirando la ayuda.";
export const MENSAJE_CONTACTO_RED = "No hemos podido enviar tu mensaje. Prueba de nuevo en un momento, o escríbenos a soporte@audite.tv.";
export const MENSAJE_CORREO = "Escribe un correo válido para que podamos enviarte el enlace de confirmación.";
export const MENSAJE_CONTACTO_CORREO = "Revisa el correo. Sin un email válido no podemos responderte.";
export const MENSAJE_CONTACTO_VACIO = "Cuéntanos, aunque sea en dos líneas, en qué podemos ayudarte.";
export const MENSAJE_RED = "No hemos podido enviarte el correo. Prueba de nuevo, o escríbenos a soporte@audite.tv.";
export const MENSAJE_CADUCADO = "Este enlace ya no vale. Vuelve a dejar tu correo en audite.tv para recibir uno nuevo.";
export const MENSAJE_CONFIRMADA = "Gracias. Ya estás en la lista de Audite. Puedes darte de baja cuando quieras.";
