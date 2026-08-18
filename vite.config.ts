import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      framer: fileURLToPath(new URL("./src/dither/framer-shim.ts", import.meta.url)),
    },
  },
  base: "/",
  server: { host: "127.0.0.1", port: 4321, open: true },
});
