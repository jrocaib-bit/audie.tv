import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { seccionesAyuda, textoAyuda } from "./faq-centro";
import { INTRO_CONTACTO, MENSAJE_AVISO, MENSAJE_CADUCADO, MENSAJE_CONFIRMADA, MENSAJE_CONTACTO_OK, MENSAJE_LISTA } from "./formularios/logica";

describe("centro de ayuda", () => {
  it("publica la v6 sin marcas pendientes y con el horario de soporte", () => {
    const texto = textoAyuda(false);
    expect(texto).not.toContain("[PENDIENTE");
    expect(texto).not.toContain("<!--");
    expect(texto).toContain("https://audite.tv/contacto");
    expect(texto).toContain("Atendemos de lunes a viernes, de 9:00 a 18:00 (hora de Madrid), salvo festivos nacionales. Te responderemos como máximo en 48 horas laborables; lo habitual es que contestemos en el día.");
    expect(texto).toContain("8,00 € al año hasta el 5 de enero de 2027");
    expect(texto).toContain("12,99 € al año");
    expect(texto).toContain("gratis y no hace falta suscripción");
    expect(texto).toContain("En la app hace falta una cuenta: regístrate o inicia sesión. No se pide suscripción ni prueba.");
    expect(texto).not.toMatch(/si cancelas y vuelves|cancelas el anual de 8/i);
    expect(texto).not.toMatch(/no hace falta cuenta|sin cuenta/i);
    expect(texto).toContain("La voz y la música están generadas con IA.");
    expect(texto).toContain("Disponible en español; más idiomas pronto.");
    expect(texto).not.toContain("Iniciar sesión con Google");
    expect(seccionesAyuda(true).find((seccion) => seccion.id === "cuenta-e-inicio-de-sesion")?.preguntas[0]?.respuesta).toContain("Iniciar sesión con Google");
  });

  it("usa los textos de pantalla de los formularios", () => {
    expect(INTRO_CONTACTO).toBe("¿Tienes una duda o una sugerencia? Escríbenos y te contestamos en menos de 48 horas laborables (de lunes a viernes, de 9:00 a 18:00, hora de Madrid).");
    expect(MENSAJE_CONTACTO_OK).toBe("Gracias, hemos recibido tu mensaje. Te responderemos a tu correo en menos de 48 horas laborables. Mientras tanto, puedes consultar la ayuda.");
    expect(MENSAJE_AVISO).toBe("Te avisaremos.");
    const vista = readFileSync(path.resolve("apps/web/src/components/formularios.tsx"), "utf8");
    expect(vista).toContain("Gracias, hemos recibido tu mensaje. Te responderemos a tu correo en menos de 48 horas laborables. Mientras tanto, puedes consultar la");
    expect(vista).toContain('href="/ayuda"');
    const app = readFileSync(path.resolve("apps/web/src/app/app/pagina.tsx"), "utf8");
    expect(app).toContain("Escucha la Biblia cada día en tu móvil. Empezamos el 29 de noviembre con el reto de Adviento. Déjanos tu correo y te avisamos el primer día.");
    expect(app).not.toContain("Próximamente en el móvil");
    expect(app).toContain("border-[#F4ECE2]/30");
    expect(vista).toContain("Avísame cuando salga");
    expect(vista.match(/Próximamente/g)).toHaveLength(1);
    expect(MENSAJE_LISTA).toContain("no-reply@audite.tv");
    expect(MENSAJE_CONFIRMADA).toContain("Ya estás en la lista");
    expect(MENSAJE_CADUCADO).toContain("Este enlace ya no vale");
    expect([MENSAJE_CONTACTO_OK, MENSAJE_LISTA, MENSAJE_CONFIRMADA, MENSAJE_CADUCADO].join("\n")).not.toContain("[PENDIENTE");
  });
});
