import defaultTheme from "tailwindcss/defaultTheme";
import tokens from "./tokens.json";

const exclude = ["fonts", "typography"];

const themeBase = {
  gridAutoColumns: {
    ...defaultTheme.gridAutoColumns,
    max: "minmax(0, max-content)",
  },
  extend: {
    typography: ({ theme }) => ({
      DEFAULT: {
        css: [
          {
            maxWidth: "var(--prose-maxWidth)",
            "--tw-prose-body": theme("colors.black"),
            "--tw-prose-headings": "var(--tw-prose-body)",
            "--tw-prose-lead": "var(--tw-prose-body)",
            "--tw-prose-links": "var(--tw-prose-body)",
            "--tw-prose-bold": "var(--tw-prose-body)",
            "--tw-prose-counters": "var(--tw-prose-body)",
            "--tw-prose-bullets": "var(--tw-prose-body)",
            "--tw-prose-hr": theme("colors.grey[900]"),
            "--tw-prose-quotes": "var(--tw-prose-body)",
            "--tw-prose-quote-borders": theme("colors.grey[900]"),
            "--tw-prose-captions": "var(--tw-prose-body)",
            "--tw-prose-code": "var(--tw-prose-body)",
            "--tw-prose-pre-code": "var(--tw-prose-body)",
            "--tw-prose-pre-bg": theme("colors.grey[100]"),
            "--tw-prose-th-borders": theme("colors.grey[900]"),
            "--tw-prose-td-borders": theme("colors.grey[900]"),
          },
        ],
      },
    }),
    height: {
      screen: "calc(100 * var(--vh))",
    },
    maxHeight: {
      screen: "calc(100 * var(--vh))",
    },
    minHeight: {
      screen: "calc(100 * var(--vh))",
    },
  },
};

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

export const root = () => {
  const rootParsed: any = Object.entries(tokens)
    .filter(([key]) => !exclude.includes(key))
    .reduce((acc, [key, value]) => {
      acc = {
        ...acc,
        ...baseEntry(key, value, acc),
      };
      return acc;
    }, {});

  return Object.keys(rootParsed)
    .sort((a, b) => {
      if (a.startsWith("@media")) {
        return 1;
      }
      return -1;
    })
    .reduce((acc, key) => {
      acc = {
        ...acc,
        [key]: rootParsed[key],
      };
      return acc;
    }, {});
};

export const typography = (params: any) => {
  const typographyParsed: any = Object.entries(params).reduce((acc, [key, value]) => {
    acc = {
      ...acc,
      ...typographyEntry(key, value, acc),
    };
    return acc;
  }, {});

  return Object.keys(typographyParsed)
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
};

export const theme = Object.entries(tokens)
  .filter(([key]) => !exclude.includes(key))
  .reduce((acc, [key, value]) => {
    acc = { ...acc, ...themeEntry(key, value) };
    return acc;
  }, themeBase);
