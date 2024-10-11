import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import typographyPlugin from "@tailwindcss/typography";
import defaultTheme from "tailwindcss/defaultTheme";
import tokens from "./tokens.json";

const parsedValue = (key: string, value: any) => {
  switch (typeof value) {
    case "object": {
      return Object.keys(value).reduce((acc, k) => {
        acc = { ...acc, [k]: `var(--${key}-${k})` };
        return acc;
      }, {});
    }
    default: {
      return `var(--${key})`;
    }
  }
};

const themeEntry = (key: string, value: any) => {
  switch (key) {
    case "line": {
      return {
        border: parsedValue(key, value),
        strokeWidth: parsedValue(key, value),
      };
    }
    default: {
      return {
        [key]: parsedValue(key, value),
      };
    }
  }
};

const baseEntry = (key: string, value: any) => {
  switch (typeof value) {
    case "object": {
      console.log("value", value);

      return Object.entries(value).reduce(([k, v]) => {
        switch (typeof v) {
          case "object": {
            return;
          }
          default: {
            return {
              [`--${key}-${k}`]: v,
            };
          }
        }
      });
    }
    default: {
      return {
        [`--${key}`]: value,
      };
    }
  }
};

const themeBase = {
  gridAutoColumns: {
    ...defaultTheme.gridAutoColumns,
    max: "minmax(0, max-content)",
  },
};

const config: Partial<Config> = () => {
  const exclude = ["fonts", "typography"];
  const theme = Object.entries(tokens)
    .filter(([key]) => !exclude.includes(key))
    .reduce((acc, [key, value]) => {
      acc = { ...acc, ...themeEntry(key, value) };
      return acc;
    }, themeBase);

  const plugins = [typographyPlugin];

  return {
    theme,
    plugins: [
      typographyPlugin,
      plugin(({ addBase, addComponents, addUtilities }) => {
        addBase({
          ":root": Object.entries(tokens)
            .filter(([key]) => !exclude.includes(key))
            .reduce((acc, [key, value]) => {
              acc = {
                ...acc,
                ...baseEntry(key, value),
              };
              return acc;
            }, {}),
        });
      }),
    ],
  };
};

const result: Partial<Config> = {
  theme: {
    screens: {
      s: "1000px",
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      black: "var(--color-black)",
      white: "var(--color-white)",
    },
    spacing: {
      0: "var(--spacing-0)",
      s: "var(--spacing-s)",
      m: "var(--spacing-m)",
      l: "var(--spacing-l)",
      xl: "var(--spacing-xl)",
      pagex: "var(--spacing-page-x)",
      pagey: "var(--spacing-page-y)",
    },
    gridAutoColumns: {
      ...defaultTheme.gridAutoColumns,
      max: "minmax(0, max-content)",
    },
    border: {},
    stroke: {},
    borderRadius: {
      DEFAULT: "var(--radius-default)",
      none: "0px",
    },
    fontFamily: {
      redhat: ["var(--font-redhat)"],
      dexlite: ["var(--font-dexlite)"],
    },
  },
  plugins: [
    typographyPlugin,
    plugin(function ({ addBase, addUtilities }) {
      addBase({
        ":root": {
          "--spacing-0": "0px",
          "--spacing-s": "8px",
          "--spacing-m": "20px",
          "--spacing-l": "36px",
          "--spacing-xl": "72px",
          "--spacing-page-x": "20px",
          "--spacing-page-y": "48px",

          "@media screen(s)": {
            "--spacing-l": "48px",
            "--spacing-page-x": "72px",
            "--spacing-page-y": "72px",
          },

          "--color-black": "rgb(0,0,0)",
          "--color-white": "rgb(255,255,255)",
          "--color-purple": "rgb(90,60,220)",
          "--color-yellow": "rgb(245,205,90)",
          "--color-green": "rgb(40,230,205)",

          "--radius-default": "6px",
          "--radius-container": "10px",
        },
        "@font-face": {
          fontFamily: "Giga Haas Display",
          src: "url('/fonts/gigahaasdisplay-500.woff2') format('woff2')",
        },
      });
      addUtilities({
        ".typo-p": {
          fontFamily: theme("typography.DEFAULT.css.p.fontFamily"),
          fontSize: theme("typography.DEFAULT.css.p.fontSize"),
          lineHeight: theme("typography.DEFAULT.css.p.lineHeight"),
        },
        ".typo-1": {
          fontFamily: theme("typography.DEFAULT.css.h1.fontFamily"),
          fontSize: theme("typography.DEFAULT.css.h1.fontSize"),
          lineHeight: theme("typography.DEFAULT.css.h1.lineHeight"),
        },
        ".typo-2": {
          fontFamily: theme("typography.DEFAULT.css.h2.fontFamily"),
          fontSize: theme("typography.DEFAULT.css.h2.fontSize"),
          lineHeight: theme("typography.DEFAULT.css.h2.lineHeight"),
          color: theme("colors.purple"),
          textTransform: theme("typography.DEFAULT.css.h2.textTransform"),
        },
      });
    }),
  ],
};

export default config;
