import * as esbuild from "esbuild";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const shared = resolve(__dirname, "../shared/src/index.ts");
const sharedSchemas = resolve(__dirname, "../shared/src/schemas/index.ts");

async function main() {
  // Build content script as self-contained IIFE (no imports!)
  await esbuild.build({
    entryPoints: [resolve(__dirname, "src/content/index.ts")],
    bundle: true,
    format: "iife",
    outfile: resolve(__dirname, "dist/content.js"),
    sourcemap: true,
    define: { "process.env.NODE_ENV": '"production"' },
    alias: {
      "@veil/shared": shared,
      "@veil/shared/schemas": sharedSchemas,
    },
    target: "chrome110",
    logLevel: "info",
  });

  // Build background as self-contained ESM (no external chunk imports)
  await esbuild.build({
    entryPoints: [resolve(__dirname, "src/background/index.ts")],
    bundle: true,
    format: "esm",
    outfile: resolve(__dirname, "dist/background.js"),
    sourcemap: true,
    define: { "process.env.NODE_ENV": '"production"' },
    alias: {
      "@veil/shared": shared,
      "@veil/shared/schemas": sharedSchemas,
    },
    target: "chrome110",
    logLevel: "info",
  });

  // Copy manifest
  const manifestPath = resolve(__dirname, "src/manifest.json");
  const distManifest = resolve(__dirname, "dist/manifest.json");
  copyFileSync(manifestPath, distManifest);

  // Copy icons
  for (const size of [16, 32, 48, 128]) {
    const src = resolve(__dirname, `src/icon-${size}.svg`);
    const dst = resolve(__dirname, `dist/icon-${size}.svg`);
    if (existsSync(src)) copyFileSync(src, dst);
  }

  console.log("Build complete: content.js (IIFE), background.js (ESM)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
