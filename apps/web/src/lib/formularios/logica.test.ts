import { describe, expect, it } from "vitest";
import { MENSAJE_LISTA, apuntarLista, confirmarToken, consumirLimite, crearToken, darDeBaja, debeEnviarCorreo, decidirEnvio, firmarMarca, marcaAceptada } from "./logica";

const sal = "sal-de-prueba";
const ahora = Date.parse("2026-11-10T12:00:00Z");

describe("formularios", () => {
  it("valida, ignora el cebo y exige tres segundos", () => {
    const firma = firmarMarca(ahora - 4000, sal);
    expect(decidirEnvio({ miel: "bot", firma, sal, ahora, permitido: true, valido: true })).toBe("descartado");
    expect(decidirEnvio({ miel: "", firma: firmarMarca(ahora - 1000, sal), sal, ahora, permitido: true, valido: true })).toBe("descartado");
    expect(marcaAceptada(firma, sal, ahora)).toBe(true);
    expect(decidirEnvio({ miel: "", firma, sal, ahora, permitido: true, valido: false })).toBe("invalido");
    expect(decidirEnvio({ miel: "", firma, sal, ahora, permitido: false, valido: true })).toBe("limite");
    expect(decidirEnvio({ miel: "", firma, sal, ahora, permitido: true, valido: true })).toBe("aceptado");
  });

  it("limita por ip y por correo", () => {
    let ventanas: ReturnType<typeof consumirLimite>["ventanas"] = [];
    for (let i = 0; i < 5; i += 1) {
      const paso = consumirLimite(ventanas, "ip1", `a${i}@audite.tv`, ahora);
      expect(paso.permitido).toBe(true);
      ventanas = paso.ventanas;
    }
    expect(consumirLimite(ventanas, "ip1", "nuevo@audite.tv", ahora).permitido).toBe(false);
    let dia: typeof ventanas = [];
    for (let i = 0; i < 3; i += 1) {
      const paso = consumirLimite(dia, `ip${i}`, "misma@audite.tv", ahora + i * 3600000);
      expect(paso.permitido).toBe(true);
      dia = paso.ventanas;
    }
    expect(consumirLimite(dia, "ip9", "misma@audite.tv", ahora).permitido).toBe(false);
  });

  it("confirma una sola vez y caduca a los siete días", () => {
    const token = crearToken(ahora, sal);
    const alta = apuntarLista([], { email: "Ada@Audite.tv", lista: "boletin", plataforma: null }, token);
    expect(alta.silencio).toBe(true);
    expect(MENSAJE_LISTA).not.toMatch(/ya estás|existe/i);
    const otra = apuntarLista(alta.filas.map((fila) => ({ ...fila, estado: "confirmada" as const })), { email: "ada@audite.tv", lista: "boletin", plataforma: null }, token);
    expect(otra.filas).toHaveLength(1);
    const ok = confirmarToken(alta.filas, token.token, ahora + 1000, sal);
    expect(ok.resultado).toBe("ok");
    expect(confirmarToken(ok.filas, token.token, ahora + 2000, sal).resultado).toBe("ok");
    expect(confirmarToken(alta.filas, token.token, token.expira + 1, sal).resultado).toBe("caducado");
    expect(confirmarToken(alta.filas, "otro", ahora, sal).resultado).toBe("desconocido");
  });

  it("la baja cubre las listas nuevas y el interruptor no envía", () => {
    const token = crearToken(ahora, sal);
    const alta = apuntarLista([], { email: "ada@audite.tv", lista: "lanzamiento_app", plataforma: "ios" }, token);
    const bajas = darDeBaja(alta.filas, token.token, sal);
    expect(bajas[0]?.estado).toBe("baja");
    expect(debeEnviarCorreo(undefined)).toBe(false);
    expect(debeEnviarCorreo("true")).toBe(true);
  });
});
