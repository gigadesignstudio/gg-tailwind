import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import typographyPlugin from "@tailwindcss/typography";
import defaultTheme from "tailwindcss/defaultTheme";
import tokens from "./tokens.json";

const parsedValue = (key: string, value: any) => {
  switch (typeof value) {
    case "object": {
      return Object.entries(value).reduce((acc, [k, v]) => {
        if (typeof v === "object") {
          Object.keys(v).reduce((avv, kk) => {
            if (!isNaN(Number(kk))) {
              acc = {
                ...acc,
                [k]: {
                  ...acc[k],
                  [kk]: `var(--${key}-${k}-${kk})`,
                },
              };
            } else {
              acc = { ...acc, [k]: `var(--${key}-${k})` };
            }
          }, {});
        } else if (key === "screens") {
          acc = { ...acc, [k]: v };
        } else {
          acc = { ...acc, [k]: `var(--${key}-${k})` };
        }
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

const baseEntryValue = (key: string, k: any, kk: string, vv: any) => {
  switch (true) {
    case kk === "default": {
      return {
        [`--${key}-${k}`]: vv,
      };
    }
    case !isNaN(Number(kk)): {
      return {
        [`--${key}-${k}-${kk}`]: vv,
      };
    }
    case typeof kk === "string": {
      return {
        [`@media screen(${kk})`]: {
          [`--${key}-${k}`]: vv,
        },
      };
    }
  }
};

const baseEntry = (key: string, value: any, accR: any) => {
  switch (typeof value) {
    case "object": {
      return Object.entries(value).reduce((acc, [k, v]) => {
        switch (typeof v) {
          case "object": {
            return {
              ...acc,
              ...Object.entries(v).reduce((accV, [kk, vv]) => {
                const entryValue = baseEntryValue(key, k, kk, vv);
                const [kkk, vvv] = Object.entries(entryValue)[0];
                const [kkkk, vvvv] = Object.entries(vvv)[0];
                if (kkk.startsWith("@media")) {
                  accV = {
                    ...accV,
                    [kkk]: {
                      ...accV[kkk],
                      [kkkk]: vvvv,
                    },
                  };
                } else {
                  accV = {
                    ...accV,
                    ...entryValue,
                  };
                }
                return accV;
              }, acc),
            };
          }
          default: {
            return {
              ...acc,
              [`--${key}-${k}`]: v,
            };
          }
        }
      }, accR);
    }
    default: {
      return {
        [`--${key}`]: value,
      };
    }
  }
};

const typographyEntryValue = (key: string, k: any, v: any, accR: any) => {
  switch (typeof v) {
    case "object": {
      Object.entries(v).reduce((accV, [kk, vv]) => {
        if (kk !== "default") {
          if (!accV[`@media screen(${kk})`]) {
            accV[`@media screen(${kk})`] = {};
            if (!accV[`@media screen(${kk})`][`.typo-${key}`]) {
              accV[`@media screen(${kk})`][`.typo-${key}`] = {};
            }
          }
          accV[`@media screen(${kk})`][`.typo-${key}`][k] = vv;
        }
        return accV;
      }, accR);

      return v.default;
    }
    default: {
      return v;
    }
  }
};

const typographyEntry = (key: string, value: any, accR: any) => {
  return Object.entries(value).reduce((accV, [k, v]) => {
    const entryValue = typographyEntryValue(key, k, v, accR);
    if (!accV[`.typo-${key}`]) {
      accV[`.typo-${key}`] = {};
    }
    accV[`.typo-${key}`][k] = entryValue;
    return accV;
  }, accR);
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

  return {
    theme,
    plugins: [
      typographyPlugin,
      plugin(({ addBase, addComponents, addUtilities }) => {
        const root = Object.entries(tokens)
          .filter(([key]) => !exclude.includes(key))
          .reduce((acc, [key, value]) => {
            acc = {
              ...acc,
              ...baseEntry(key, value, acc),
            };
            return acc;
          }, {});

        const rootSorted = Object.keys(root)
          .sort((a, b) => {
            if (a.startsWith("@media")) {
              return 1;
            }
            return -1;
          })
          .reduce((acc, key) => {
            acc = {
              ...acc,
              [key]: root[key],
            };
            return acc;
          }, {});

        addBase({
          ":root": rootSorted,
        });

        const fontFace = Object.keys(tokens).find((key) => key === "fonts");
        if (fontFace) {
          tokens[fontFace].forEach((font) => {
            addBase({
              "@font-face": {
                fontFamily: font.family,
                weight: font.weight,
                style: font.style,
                src: font.src,
              },
            });
          });
        }

        const typography = Object.keys(tokens).find((key) => key === "typography");
        if (typography) {
          const obj = {};
          const typographyParsed = Object.entries(tokens[typography]).reduce(
            (acc, [key, value]) => {
              acc = {
                ...acc,
                ...typographyEntry(key, value, acc),
              };
              return acc;
            },
            obj
          );

          const typographySorted = Object.keys(typographyParsed)
            .sort((a, b) => {
              if (a.startsWith("@media")) {
                return 1;
              }
              return -1;
            })
            .reduce((acc, key) => {
              acc = {
                ...acc,
                [key]: typographyParsed[key],
              };
              return acc;
            }, {});

          console.log(typographySorted);

          addUtilities({
            ...typographySorted,
          });
        }
      }),
    ],
  };
};

// const result: Partial<Config> = {
//   theme: {
//     screens: {
//       s: "1000px",
//     },
//     colors: {
//       transparent: "transparent",
//       current: "currentColor",
//       black: "var(--color-black)",
//       white: "var(--color-white)",
//     },
//     spacing: {
//       0: "var(--spacing-0)",
//       s: "var(--spacing-s)",
//       m: "var(--spacing-m)",
//       l: "var(--spacing-l)",
//       xl: "var(--spacing-xl)",
//       pagex: "var(--spacing-page-x)",
//       pagey: "var(--spacing-page-y)",
//     },
//     gridAutoColumns: {
//       ...defaultTheme.gridAutoColumns,
//       max: "minmax(0, max-content)",
//     },
//     border: {},
//     stroke: {},
//     borderRadius: {
//       DEFAULT: "var(--radius-default)",
//       none: "0px",
//     },
//     fontFamily: {
//       redhat: ["var(--font-redhat)"],
//       dexlite: ["var(--font-dexlite)"],
//     },
//   },
//   plugins: [
//     typographyPlugin,
//     plugin(function ({ addBase, addUtilities }) {
//       addBase({
//         ":root": {
//           "--spacing-0": "0px",
//           "--spacing-s": "8px",
//           "--spacing-m": "20px",
//           "--spacing-l": "36px",
//           "--spacing-xl": "72px",
//           "--spacing-page-x": "20px",
//           "--spacing-page-y": "48px",

//           "@media screen(s)": {
//             "--spacing-l": "48px",
//             "--spacing-page-x": "72px",
//             "--spacing-page-y": "72px",
//           },

//           "--color-black": "rgb(0,0,0)",
//           "--color-white": "rgb(255,255,255)",
//           "--color-purple": "rgb(90,60,220)",
//           "--color-yellow": "rgb(245,205,90)",
//           "--color-green": "rgb(40,230,205)",

//           "--radius-default": "6px",
//           "--radius-container": "10px",
//         },
//         "@font-face": {
//           fontFamily: "Giga Haas Display",
//           src: "url('/fonts/gigahaasdisplay-500.woff2') format('woff2')",
//         },
//       });
//       addUtilities({
//         ".typo-p": {
//           fontFamily: theme("typography.DEFAULT.css.p.fontFamily"),
//           fontSize: theme("typography.DEFAULT.css.p.fontSize"),
//           lineHeight: theme("typography.DEFAULT.css.p.lineHeight"),
//         },
//         ".typo-1": {
//           fontFamily: theme("typography.DEFAULT.css.h1.fontFamily"),
//           fontSize: theme("typography.DEFAULT.css.h1.fontSize"),
//           lineHeight: theme("typography.DEFAULT.css.h1.lineHeight"),
//         },
//         ".typo-2": {
//           fontFamily: theme("typography.DEFAULT.css.h2.fontFamily"),
//           fontSize: theme("typography.DEFAULT.css.h2.fontSize"),
//           lineHeight: theme("typography.DEFAULT.css.h2.lineHeight"),
//           color: theme("colors.purple"),
//           textTransform: theme("typography.DEFAULT.css.h2.textTransform"),
//         },
//       });
//     }),
//   ],
// };

export default config;
