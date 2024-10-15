import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import typographyPlugin from "@tailwindcss/typography";
import { theme, root, typography } from "./main";

const config: Partial<Config> = (tokens: any) => {
  return {
    theme: theme(tokens),
    plugins: [
      typographyPlugin({
        className: "wysiwyg",
      }),
      plugin(({ addBase, addComponents, addUtilities }) => {
        addBase({
          ":root": root(tokens),
        });

        const fontFace = Object.keys(tokens).find((key) => key === "fonts");
        if (fontFace) {
          tokens[fontFace].forEach((font) => {
            addBase({
              "@font-face": {
                fontFamily: font.fontFamily,
                fontWeight: font.fontWeight,
                fontStyle: font.fontStyle,
                src: font.src,
              },
            });
          });
        }

        const typographyExists = Object.keys(tokens).find((key) => key === "typography");
        if (typographyExists) {
          addUtilities({
            ...typography(tokens.typography),
          });
        }

        addUtilities({
          ".lay": {
            display: "grid",
            gridAutoFlow: "initial",
            gridAutoColumns: "minmax(0, 1fr)",
            gridAutoRows: "minmax(0, auto)",
          },
          ".lay-v": {
            gridAutoFlow: "column",
          },
          ".lay-h": {
            gridAutoFlow: "column",
          },
          ".lay-o": {
            display: "grid",
            "> *": {
              gridArea: "1 / 1",
            },
          },
        });
      }),
    ],
  };
};

export default config;
