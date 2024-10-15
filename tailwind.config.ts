import type { Config } from "tailwindcss";
import tokens from "./src/assets/tokens.json";
import preset from "./src/assets/preset";

export default {
  content: ["./src/*.vue"],
  presets: [preset(tokens)],
} satisfies Config;
