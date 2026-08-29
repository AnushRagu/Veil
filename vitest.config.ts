import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules", "dist", "tests", "*.config.*", "extension", "server", "shared"],
    },
    resolve: {
      alias: {
        "@privatesight/shared": path.resolve(__dirname, "shared/src/index.ts"),
      },
    },
    deps: {
      inline: ["@privatesight/shared"],
    },
  },
});