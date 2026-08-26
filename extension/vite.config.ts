import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@veil/shared": resolve(__dirname, "../shared/src/index.ts"),
      "@veil/shared/schemas": resolve(__dirname, "../shared/src/schemas/index.ts"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
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
