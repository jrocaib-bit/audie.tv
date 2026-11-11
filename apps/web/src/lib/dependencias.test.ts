import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("dependencias web", () => {
  it("declara el paquete de correos y resend", () => {
    const paquete = JSON.parse(readFileSync(path.resolve("apps/web/package.json"), "utf8")) as { dependencies: Record<string, string> };
    expect(paquete.dependencies["@audite/emails"]).toBeTruthy();
    expect(paquete.dependencies.resend).toBeTruthy();
    expect(paquete.dependencies.zod).toBeTruthy();
  });
});
