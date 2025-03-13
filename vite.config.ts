import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

import tokensToTw from "./src/tokens-to-tw";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tokensToTw("src/assets/css/tokens.json", "src/assets/css/tokens.css"),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
