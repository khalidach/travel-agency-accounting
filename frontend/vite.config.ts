import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      // Correct path to the main process file in the project root
      entry: path.join(__dirname, "../electron.cjs"),
    }),
  ],
  build: {
    rollupOptions: {
      external: ["better-sqlite3"],
    },
  },
  optimizeDeps: {
    exclude: ["lucide-react", "better-sqlite3"],
  },
});
