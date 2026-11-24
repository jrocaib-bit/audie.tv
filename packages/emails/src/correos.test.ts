import { describe, expect, it, vi } from "vitest";
import { DIAS_INACTIVIDAD, DIAS_RECUPERACION_TRAS_CANCELAR } from "./disparadores";
import { enviarCorreo } from "./enviar";
import { componer } from "./componer";
import { IDS_CORREO, saludo } from "./textos";

const datos = {
  nombre: "Ada",
  plan: "anual" as const,
  fecha_fin_prueba: "17 de noviembre de 2026",
  fecha_proximo_cobro: "17 de noviembre de 2026",
  plataforma: "App Store" as const,
  nombre_reto: "Adviento con Isaías",
  reto_id: "adviento-isaias",
  fecha_fin_acceso: "1 de diciembre de 2026",
  token: "00000000-0000-4000-8000-000000000001",
};

describe("correos de ciclo de vida", () => {
  it("el acuse y la confirmación usan el texto de soporte v4", async () => {
    const acuse = await componer("acuse_soporte", { nombre: "Ada", correo: "ada@audite.tv" });
    expect(acuse.preheader).toBe("Gracias por escribirnos. Te responderemos como máximo en 48 horas laborables.");
    expect(acuse.texto).toContain("de 9:00 a 18:00 (hora de Madrid)");
    expect(acuse.texto).toContain("https://audite.tv/contacto");
    expect(acuse.texto).not.toContain("ada@audite.tv\n\n");
    const confirmar = await componer("confirmacion_boletin", { correo: "ada@audite.tv", token: datos.token });
    expect(confirmar.preheader).toContain("«Confirmar suscripción»");
    expect(confirmar.texto).toContain("abre este enlace y pulsa «Confirmar suscripción»");
    const veces = (valor: string, aguja: string) => valor.split(aguja).length - 1;
    const url = `https://audite.tv/correo/confirmar?t=${datos.token}`;
    expect(veces(confirmar.texto, url)).toBe(1);
    expect(veces(confirmar.html.replace(/<[^>]+>/g, " "), url)).toBe(1);
    expect(confirmar.html).toContain(`href="${url}"`);
    const bienvenida = await componer("bienvenida_lista", { token: datos.token });
    const frase = "El 29 de noviembre empieza el Adviento. Si te viene bien, ese día abre el reto Adviento con Isaías, en español. Este reto es gratis: solo tienes que descargar la app y crear tu cuenta, sin suscripción.";
    expect(bienvenida.texto).toContain(frase);
    expect(frase).not.toContain("https://audite.tv");
    const casa = (valor: string) => (valor.match(/https:\/\/audite\.tv(?!\/)/g) ?? []).length;
    expect(casa(bienvenida.texto)).toBe(1);
    expect(casa(bienvenida.html.replace(/<[^>]+>/g, " "))).toBe(1);
    expect(veces(acuse.texto, "https://audite.tv/ayuda")).toBe(1);
    expect(veces(acuse.html.replace(/<[^>]+>/g, " "), "https://audite.tv/ayuda")).toBe(1);
  });

  it("usa el saludo exacto y omite lo que no se sabe", async () => {
    expect(saludo(null)).toBe("Hola:");
    expect(saludo("Ada")).toBe("Hola, Ada:");
    const sinPrueba = await componer("bienvenida", { sin_prueba: true });
    expect(sinPrueba.texto.startsWith("Hola:")).toBe(true);
    expect(sinPrueba.texto).not.toContain("se cobrará");
    const sinAcceso = await componer("recuperacion", { nombre: "Ada", token: datos.token });
    expect(sinAcceso.texto).not.toContain("hasta el");
    const sinReto = await componer("inactividad_7", { nombre: "Ada", token: datos.token });
    expect(sinReto.texto).not.toContain("te puede acompañar el reto");
  });

  it("el texto y el html dicen lo mismo, y el marketing lleva la baja", async () => {
    for (const id of IDS_CORREO) {
      const correo = await componer(id, datos);
      expect(correo.asuntoA.length).toBeGreaterThan(0);
      expect(correo.asuntoB.length).toBeGreaterThan(0);
      expect(correo.html).toContain(correo.cta);
      expect(correo.texto).toContain(correo.cta);
      expect(correo.texto).toContain("no-reply@audite.tv");
      expect(correo.texto).toContain("https://audite.tv/privacidad");
      if (correo.tipo === "marketing") {
        expect(correo.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
        expect(correo.headers["List-Unsubscribe"]).toContain("https://audite.tv/correo/baja?t=");
        expect(correo.texto).toContain("Si prefieres no recibir este tipo de correos:");
      } else {
        expect(correo.headers["List-Unsubscribe"]).toBeUndefined();
      }
    }
    const cargo = await componer("primer_cobro", datos);
    expect(cargo.texto).toContain("El reembolso de un pago de la tienda lo gestiona Apple o Google");
  });

  it("no envía marketing sin consentimiento ni después de la baja", async () => {
    const enviar = vi.fn(async () => undefined);
    const base = { id: "inactividad_7" as const, datos, to: "ada@example.com", enviar };
    await expect(enviarCorreo({ ...base, preferencia: { marketing_consent: false, unsubscribed_at: null } })).resolves.toBe("omitido");
    await expect(enviarCorreo({ ...base, preferencia: { marketing_consent: true, unsubscribed_at: "2026-11-10" } })).resolves.toBe("omitido");
    await expect(enviarCorreo({ ...base, preferencia: null })).resolves.toBe("omitido");
    expect(enviar).not.toHaveBeenCalled();
    await expect(enviarCorreo({ ...base, preferencia: { marketing_consent: true, unsubscribed_at: null } })).resolves.toBe("listo");
    expect(enviar).toHaveBeenCalledOnce();
    const payload = enviar.mock.calls[0]?.[0] as { from: string; replyTo: string; headers: Record<string, string> };
    expect(payload.from).toBe("Audite <no-reply@audite.tv>");
    expect(payload.replyTo).toBe("soporte@audite.tv");
    expect(payload.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });

  it("el 6A no pide prueba y el 6B anuncia el reto gratis", async () => {
    const servicio = await componer("adviento_servicio", { nombre: "Ada" });
    expect(servicio.texto).toContain("Este reto es gratis: solo tienes que descargar la app y crear tu cuenta, sin suscripción.");
    expect(servicio.texto).toContain("El primer domingo puedes abrirlo en la app.");
    expect(servicio.texto).not.toContain("suscríbete");
    const campana = await componer("adviento_campana", { nombre: "Ada", token: datos.token });
    expect(campana.asuntoB).toBe("Adviento con Isaías, gratis, desde el 29 de noviembre");
    expect(campana.preheader).toBe("Un pasaje al día hasta Nochebuena. El reto es gratis: descarga la app y crea tu cuenta.");
    expect(campana.cta).toBe("Descargar la app y abrir el reto, gratis");
    expect(campana.ctaUrl).toBe("https://audite.tv/app");
    expect(campana.texto).toContain("mantiene 8,00 € al año mientras siga suscrito");
    expect(campana.texto).toContain("12,99 €");
    expect(campana.texto).not.toMatch(/primer año|8,00 € al año hasta el 5 de enero/i);
    const fin = await componer("fin_prueba_sin_cobro", { cuando: new Date("2026-12-01T12:00:00Z") });
    expect(fin.texto).toContain("mantiene 8,00 € al año mientras siga suscrito");
    expect(fin.texto).toContain("el anual para suscripciones nuevas es 12,99 € al año");
    expect(fin.texto).toContain("El reto Adviento con Isaías es gratis: solo tienes que descargar la app y crear tu cuenta, sin suscripción.");
    expect(fin.texto).not.toMatch(/si cancelas y vuelves/i);
  });

  it("el 3B nombra el Adviento solo del 29 de noviembre al 24 de diciembre", async () => {
    const frase = "El reto Adviento con Isaías es gratis: solo tienes que descargar la app y crear tu cuenta, sin suscripción.";
    const antes = await componer("fin_prueba_sin_cobro", { cuando: new Date("2026-11-28T22:59:00Z") });
    const inicio = await componer("fin_prueba_sin_cobro", { cuando: new Date("2026-11-28T23:00:00Z") });
    const ultimo = await componer("fin_prueba_sin_cobro", { cuando: new Date("2026-12-24T22:59:00Z") });
    const despues = await componer("fin_prueba_sin_cobro", { cuando: new Date("2026-12-24T23:00:00Z") });
    expect(antes.texto).not.toContain(frase);
    expect(inicio.texto).toContain(frase);
    expect(ultimo.texto).toContain(frase);
    expect(despues.texto).not.toContain(frase);
  });

  it("documenta los plazos y no los programa", () => {
    expect(DIAS_INACTIVIDAD).toEqual([7, 14]);
    expect(DIAS_RECUPERACION_TRAS_CANCELAR).toBe(3);
  });
});
