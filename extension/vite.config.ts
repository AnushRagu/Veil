import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync, unlinkSync, statSync } from "fs";
import { resolve, join } from "path";

const ONNXRT_DIR = resolve(__dirname, "../node_modules/onnxruntime-web/dist");
const ASSETS_TO_COPY = [
  "ort.bundle.min.mjs",
  "ort-all.bundle.min.mjs",
  "ort-wasm-simd-threaded.jsep.wasm",
  "ort-wasm-simd-threaded.wasm",
  "ort-wasm-simd-threaded.mjs",
  "offscreen.html",
];

function flattenPopupHtml() {
  return {
    name: "flatten-popup-html",
    closeBundle() {
      // After all assets are emitted, move dist/src/popup/index.html to dist/popup.html
      // and rewrite the absolute asset paths to be relative so the popup loads inside
      // the Chrome extension (where /popup.js does NOT resolve to dist/popup.js).
      const srcHtml = resolve(__dirname, "dist/src/popup/index.html");
      const destHtml = resolve(__dirname, "dist/popup.html");
      if (!existsSync(srcHtml)) return;

      let html = readFileSync(srcHtml, "utf8");
      html = html.replace(/(src|href)="\/([^"]+)"/g, (_match, attr, path) => `${attr}="./${path}"`);

      writeFileSync(destHtml, html);

      // Clean up the now-redundant src/ subtree.
      const srcDir = resolve(__dirname, "dist/src");
      if (existsSync(srcDir)) {
        const removeRecursive = (dir: string) => {
          for (const entry of readdirSync(dir)) {
            const full = join(dir, entry);
            if (statSync(full).isDirectory()) {
              removeRecursive(full);
            } else {
              unlinkSync(full);
            }
          }
          // Best-effort: only remove the leaf if it's now empty
          try {
            readdirSync(dir);
            // Don't rmdir the top-level src/ — other plugins may not be done.
          } catch {}
        };
        removeRecursive(srcDir);
      }
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    flattenPopupHtml(),
    {
      name: "copy-manifest",
      closeBundle() {
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
    {
      name: "copy-onnx-assets",
      closeBundle() {
        const distDir = resolve(__dirname, "dist");
        const srcDir = resolve(__dirname, "src");
        ASSETS_TO_COPY.forEach((asset) => {
          let src: string;
          if (asset === "offscreen.html") {
            src = resolve(srcDir, "offscreen/index.html");
          } else {
            src = join(ONNXRT_DIR, asset);
          }
          if (existsSync(src)) {
            const dest = resolve(distDir, asset);
            mkdirSync(resolve(distDir, ".."), { recursive: true });
            copyFileSync(src, dest);
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@privatesight/shared": resolve(__dirname, "../shared/src/index.ts"),
      "@privatesight/shared/schemas": resolve(__dirname, "../shared/src/schemas/index.ts"),
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