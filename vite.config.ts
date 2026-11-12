import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: { ignored: ["**/.tools/**", "**/src-tauri/**", "**/artifacts/**"] },
  },
  optimizeDeps: { entries: ["index.html"] },
  envPrefix: ["VITE_", "TAURI_ENV_"],
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: {
          highlighter: [
            "shiki/core",
            "shiki/engine/javascript",
            "@shikijs/langs/java",
            "@shikijs/themes/github-dark",
            "@shikijs/themes/github-light",
          ],
        },
      },
    },
  },
});
