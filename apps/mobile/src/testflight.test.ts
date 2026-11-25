import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const PROYECTO = "5bdd4443-d992-4072-bb67-6920b260db4e";
const app = require("../app.json").expo as {
  version: string;
  ios: { supportsTablet: boolean; bundleIdentifier: string; buildNumber?: string; config: { usesNonExemptEncryption: boolean } };
  android: { package: string; versionCode: number };
  plugins: unknown[];
};
const eas = require("../eas.json") as {
  cli: { appVersionSource: string };
  build: {
    development: { env: { EAS_PROJECT_ID: string }; installCommand?: string; channel?: string };
    preview: { env: { EAS_PROJECT_ID: string }; installCommand?: string; channel?: string };
    production: { distribution: string; autoIncrement: boolean; ios: { distribution: string }; env: { EAS_PROJECT_ID: string }; channel?: string; installCommand?: string };
  };
  submit: { production: { ios: { ascAppId: string; bundleIdentifier: string; ascApiKeyPath: string } } };
};
const paquete = require("../package.json") as { scripts: Record<string, string> };
const { proyectoEas } = require("../app.config.js") as { proyectoEas: (env?: Record<string, string | undefined>) => { projectId?: string } };

describe("preparación de TestFlight", () => {
  it("deja la 1.0 en tv.audite.app, sin cifrado exento y sin push remoto", () => {
    expect(app.version).toBe("1.0.0");
    expect(app.ios.bundleIdentifier).toBe("tv.audite.app");
    expect(app.android.package).toBe("tv.audite.app");
    expect(app.ios.buildNumber).toBeUndefined();
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
    expect(eas.build.production.channel).toBeUndefined();
    expect(eas.build.production.installCommand).toBeUndefined();
    expect(eas.build.development.installCommand).toBeUndefined();
    expect(eas.build.preview.installCommand).toBeUndefined();
    expect(eas.build.development.channel).toBeUndefined();
    expect(eas.build.preview.channel).toBeUndefined();
    expect(eas.build.development.env.EAS_PROJECT_ID).toBe(PROYECTO);
    expect(eas.build.preview.env.EAS_PROJECT_ID).toBe(PROYECTO);
    expect(eas.build.production.env.EAS_PROJECT_ID).toBe(PROYECTO);
    expect(paquete.scripts["eas-build-pre-install"]).toBe("npm ci --prefix ../..");
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
