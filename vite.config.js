import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Project Pages live at /vectoredgeai/; local `vite`/`preview` stay at `/`.
  base: process.env.GITHUB_ACTIONS ? "/vectoredgeai/" : "/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        privacy: resolve(root, "privacy.html"),
        terms: resolve(root, "terms.html"),
      },
    },
  },
});
