import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const app = require("../app.json").expo as {
  version: string;
  ios: { supportsTablet: boolean; bundleIdentifier: string; buildNumber: string; config: { usesNonExemptEncryption: boolean } };
  android: { package: string; versionCode: number };
  plugins: unknown[];
};
const eas = require("../eas.json") as {
  cli: { appVersionSource: string };
  build: { production: { distribution: string; autoIncrement: boolean; channel: string; ios: { distribution: string }; installCommand: string } };
  submit: { production: { ios: { ascAppId: string; bundleIdentifier: string; ascApiKeyPath: string } } };
};
const { proyectoEas } = require("../app.config.js") as { proyectoEas: (env?: Record<string, string | undefined>) => { projectId?: string } };

describe("preparación de TestFlight", () => {
  it("deja la 1.0 en tv.audite.app, sin cifrado exento y sin push remoto", () => {
    expect(app.version).toBe("1.0.0");
    expect(app.ios.bundleIdentifier).toBe("tv.audite.app");
    expect(app.android.package).toBe("tv.audite.app");
    expect(app.ios.buildNumber).toBe("1");
    expect(app.android.versionCode).toBe(1);
    expect(app.ios.supportsTablet).toBe(false);
    expect(app.ios.config.usesNonExemptEncryption).toBe(false);
    const avisos = app.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === "expo-notifications") as [string, { enableRemoteNotifications?: boolean }] | undefined;
    expect(avisos?.[1].enableRemoteNotifications).toBe(false);
    const texto = readFileSync(new URL("../app.json", import.meta.url), "utf8");
    expect(texto).not.toContain("es.audite.pilot");
    expect(texto).not.toContain("aps-environment");
  });

  it("el perfil production envía a la ficha y no guarda la clave", () => {
    expect(eas.cli.appVersionSource).toBe("remote");
    expect(eas.build.production.distribution).toBe("store");
    expect(eas.build.production.ios.distribution).toBe("store");
    expect(eas.build.production.autoIncrement).toBe(true);
    expect(eas.build.production.channel).toBe("production");
    expect(eas.build.production.installCommand).toContain("npm ci --prefix ../..");
    expect(eas.submit.production.ios.ascAppId).toBe("6833136641");
    expect(eas.submit.production.ios.bundleIdentifier).toBe("tv.audite.app");
    expect(eas.submit.production.ios.ascApiKeyPath).toBe("$ASC_API_KEY_PATH");
    expect(JSON.stringify(eas)).not.toMatch(/\.p8|AuthKey_|BEGIN PRIVATE/);
  });

  it("el projectId sale solo de EAS_PROJECT_ID", () => {
    expect(proyectoEas({})).toEqual({});
    expect(proyectoEas({ EAS_PROJECT_ID: "  " })).toEqual({});
    expect(proyectoEas({ EAS_PROJECT_ID: "11111111-1111-1111-1111-111111111111" })).toEqual({
      projectId: "11111111-1111-1111-1111-111111111111",
    });
  });
});
