import { describe, expect, it } from "vitest";
import { esEnlaceAuth, parsearEnlaceAuth } from "./enlace-auth";

describe("enlace de acceso", () => {
  it("reconoce el callback de la app y el de la web", () => {
    expect(esEnlaceAuth("audite://auth/callback?code=abc")).toBe(true);
    expect(esEnlaceAuth("https://audite.tv/auth/callback?code=abc")).toBe(true);
    expect(esEnlaceAuth("https://www.audite.tv/auth/callback#access_token=x")).toBe(true);
    expect(esEnlaceAuth("https://audite.tv/escuchar")).toBe(false);
    expect(esEnlaceAuth("https://ejemplo.test/auth/callback?code=abc")).toBe(false);
  });

  it("lee el code de PKCE, el token_hash y los tokens del hash", () => {
    expect(parsearEnlaceAuth("audite://auth/callback?code=pkce-1")).toEqual({ tipo: "code", code: "pkce-1" });
    expect(parsearEnlaceAuth("https://audite.tv/auth/callback?token_hash=h1&type=magiclink")).toEqual({
      tipo: "token_hash",
      tokenHash: "h1",
      otpType: "magiclink",
    });
    expect(parsearEnlaceAuth("audite://auth/callback#access_token=at&refresh_token=rt&type=magiclink")).toEqual({
      tipo: "tokens",
      accessToken: "at",
      refreshToken: "rt",
    });
  });

  it("el code manda si vienen las dos cosas, y sin parámetros no inventa una carga", () => {
    expect(parsearEnlaceAuth("audite://auth/callback?code=c1&access_token=at&refresh_token=rt")).toEqual({
      tipo: "code",
      code: "c1",
    });
    expect(parsearEnlaceAuth("audite://auth/callback")).toBeNull();
  });
});
