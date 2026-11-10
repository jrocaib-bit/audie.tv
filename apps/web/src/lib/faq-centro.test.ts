import { describe, expect, it } from "vitest";
import { seccionesAyuda, textoAyuda } from "./faq-centro";
import { MENSAJE_CADUCADO, MENSAJE_CONFIRMADA, MENSAJE_CONTACTO_OK, MENSAJE_LISTA } from "./formularios/logica";

describe("centro de ayuda", () => {
  it("publica la v4 sin marcas pendientes y enlaza el contacto", () => {
    const texto = textoAyuda(false);
    expect(texto).not.toContain("[PENDIENTE");
    expect(texto).toContain("https://audite.tv/contacto");
    expect(texto).toContain("8,00 € al año");
    expect(texto).toContain("La voz y la música están generadas con IA.");
    expect(texto).toContain("Disponible en español; más idiomas pronto.");
    expect(texto).not.toContain("Iniciar sesión con Google");
    expect(seccionesAyuda(true).find((seccion) => seccion.id === "cuenta-e-inicio-de-sesion")?.preguntas[0]?.respuesta).toContain("Iniciar sesión con Google");
  });

  it("usa los textos de pantalla de los formularios", () => {
    expect(MENSAJE_CONTACTO_OK).toContain("Hemos recibido tu mensaje");
    expect(MENSAJE_LISTA).toContain("no-reply@audite.tv");
    expect(MENSAJE_CONFIRMADA).toContain("Ya estás en la lista");
    expect(MENSAJE_CADUCADO).toContain("Este enlace ya no vale");
    expect([MENSAJE_CONTACTO_OK, MENSAJE_LISTA, MENSAJE_CONFIRMADA, MENSAJE_CADUCADO].join("\n")).not.toContain("[PENDIENTE");
  });
});
