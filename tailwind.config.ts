import type { Config } from "tailwindcss";
import preset from "./src/assets/preset";

export default {
  content: ["./src/*.vue"],
  presets: [preset],
} satisfies Config;
