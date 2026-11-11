import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "apps/web/src"),
    },
  },
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/web/src/**/*.test.ts", "apps/web/src/**/*.test.tsx", "apps/mobile/src/**/*.test.ts"],
  },
});
