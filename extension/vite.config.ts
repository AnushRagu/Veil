import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-manifest",
      writeBundle() {
        const manifestPath = resolve(__dirname, "src/manifest.json");
        const distPath = resolve(__dirname, "dist/manifest.json");
        if (existsSync(manifestPath)) {
          copyFileSync(manifestPath, distPath);
        }
        const publicDir = resolve(__dirname, "public");
        const distPublicDir = resolve(__dirname, "dist/public");
        if (existsSync(publicDir)) {
          mkdirSync(distPublicDir, { recursive: true });
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@veil/shared": resolve(__dirname, "../shared/src/index.ts"),
      "@veil/shared/schemas": resolve(__dirname, "../shared/src/schemas/index.ts"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
  server: {
    port: 5173,
    hmr: { port: 5173 },
  },
});