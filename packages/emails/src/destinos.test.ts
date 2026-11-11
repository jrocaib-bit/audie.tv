import { describe, expect, it, vi } from "vitest";
import { avisoBloqueo, decisionEnvio } from "./destinos";
import { enviarCorreo } from "./enviar";

const base = { envioReal: true, produccion: false };

describe("destinos permitidos", () => {
  it("acepta una dirección exacta sin distinguir mayúsculas ni espacios", () => {
    expect(decisionEnvio({ ...base, permitidos: " soporte@audite.tv ", destinatarios: { to: "Soporte@Audite.tv" } })).toBe("enviar");
    expect(decisionEnvio({ ...base, permitidos: "soporte@audite.tv", destinatarios: { to: "otra@audite.tv" } })).toBe("bloqueado");
  });

  it("acepta un dominio entero", () => {
    expect(decisionEnvio({ ...base, permitidos: "@resend.dev", destinatarios: { to: "qa@Resend.dev" } })).toBe("enviar");
    expect(decisionEnvio({ ...base, permitidos: "@resend.dev", destinatarios: { to: "qa@otro.dev" } })).toBe("bloqueado");
  });

  it("bloquea el envío entero si un destinatario no está en la lista", () => {
    expect(decisionEnvio({
      ...base,
      permitidos: "soporte@audite.tv,@resend.dev",
      destinatarios: { to: "a@resend.dev", cc: "soporte@audite.tv", bcc: "fuera@gmail.com" },
    })).toBe("bloqueado");
  });

  it("con la lista vacía, la vista previa no envía y producción sí", () => {
    expect(decisionEnvio({ ...base, permitidos: "", destinatarios: { to: "a@audite.tv" } })).toBe("bloqueado");
    expect(decisionEnvio({ ...base, permitidos: undefined, destinatarios: { to: "a@audite.tv" } })).toBe("bloqueado");
    expect(decisionEnvio({ ...base, permitidos: " , ", destinatarios: { to: "a@audite.tv" } })).toBe("bloqueado");
    expect(decisionEnvio({ envioReal: true, produccion: true, permitidos: "", destinatarios: { to: "a@audite.tv" } })).toBe("enviar");
  });

  it("anota el bloqueo sin la dirección", async () => {
    const previo = {
      real: process.env.CORREO_ENVIO_REAL,
      lista: process.env.CORREO_DESTINOS_PERMITIDOS,
      vercel: process.env.VERCEL_ENV,
    };
    process.env.CORREO_ENVIO_REAL = "true";
    process.env.CORREO_DESTINOS_PERMITIDOS = "@resend.dev";
    process.env.VERCEL_ENV = "preview";
    const enviar = vi.fn(async () => undefined);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    try {
      await expect(enviarCorreo({ id: "acuse_soporte", to: "persona@gmail.com", preferencia: null, enviar })).resolves.toBe("omitido");
      expect(enviar).not.toHaveBeenCalled();
      const anotado = info.mock.calls.map((llamada) => String(llamada[0])).join("\n");
      expect(anotado).toContain("bloqueado_por_lista");
      expect(anotado).not.toContain("gmail.com");
      expect(avisoBloqueo("acuse_soporte")).not.toContain("@");
    } finally {
      process.env.CORREO_ENVIO_REAL = previo.real;
      process.env.CORREO_DESTINOS_PERMITIDOS = previo.lista;
      process.env.VERCEL_ENV = previo.vercel;
      info.mockRestore();
    }
  });
});
