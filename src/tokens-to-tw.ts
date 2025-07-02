import type { Plugin } from "vite";
import * as fs from "fs";
import * as path from "path";

interface TokenTheme {
	[key: string]: any;
	breakpoint?: Record<string, string>;
}

interface TokenConfig {
	theme: TokenTheme;
	fonts?: Record<
		string,
		{
			"font-family": string;
			"font-weight": string | number;
			"font-style": string;
			src: string;
		}
	>;
	utilities?: Record<string, Record<string, any>>;
	components?: Record<string, Record<string, unknown>>;
}

function generateCssVariableName(path: string[]): string {
	return `--${path.join("-")}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function generateMediaQuery(breakpoint: string, styles: string): string {
	return `@media (min-width: ${breakpoint}) {\n    ${styles}\n  }`;
}

function processThemeValue(
	path: string[],
	value: unknown,
	breakpoints: Record<string, string>,
): string[] {
	const cssRules: string[] = [];
	let varName = generateCssVariableName(path);

	// Special handling for colors
	if (path[0] === "color") {
		if (path.length === 2) {
			varName = `--${path.join("-")}`;
		} else if (isObject(value) && !("default" in value)) {
			// For nested color objects, use the existing path (will be handled in the object case)
			varName = `--${path.join("-")}`;
		}
	}

	if (typeof value === "string" || typeof value === "number") {
		cssRules.push(`${varName}: ${value};`);
	} else if (isObject(value)) {
		if ("default" in value) {
			cssRules.push(`${varName}: ${value.default};`);

			Object.entries(value).forEach(([key, val]) => {
				if (key !== "default" && breakpoints[key]) {
					cssRules.push(
						generateMediaQuery(breakpoints[key], `${varName}: ${val};`),
					);
				}
			});
		} else {
			Object.entries(value).forEach(([key, val]) => {
				cssRules.push(...processThemeValue([...path, key], val, breakpoints));
			});
		}
	}

	return cssRules;
}

function generateThemeVariables(theme: TokenTheme): string {
	const breakpoints = theme.breakpoint || {};
	const rootRules: string[] = [];

	Object.entries(theme).forEach(([key, value]) => {
		if (key !== "breakpoint") {
			rootRules.push(...processThemeValue([key], value, breakpoints));
		}
	});

	return `:root {\n  ${rootRules.join("\n  ")}\n}`;
}

function generateThemeSection(
	theme: TokenTheme,
	fonts?: TokenConfig["fonts"],
): string {
	const variables = Object.entries(theme)
		.filter(([key]) => key !== "breakpoint")
		.map(([key, value]) => {
			if (key === "color") {
				const colorVars: string[] = [];
				Object.entries(value).forEach(([colorName, colorValue]) => {
					if (typeof colorValue === "string") {
						colorVars.push(`--color-${colorName}: var(--color-${colorName});`);
					} else if (isObject(colorValue)) {
						Object.keys(colorValue).forEach((shade) => {
							colorVars.push(
								`--color-${colorName}-${shade}: var(--color-${colorName}-${shade});`,
							);
						});
					}
				});
				return colorVars.join("\n  ");
			}

			if (isObject(value)) {
				return Object.keys(value)
					.map((subKey) => `--${key}-${subKey}: var(--${key}-${subKey});`)
					.join("\n  ");
			}
			return `--${key}: var(--${key});`;
		})
		.join("\n  ");

	const breakpoints = Object.entries(theme.breakpoint || {})
		.map(([key, value]) => `--breakpoint-${key}: ${value};`)
		.join("\n  ");

	const fontVariables = fonts
		? Object.entries(fonts)
				.map(([key, font]) => `--font-${key}: "${font["font-family"]}";`)
				.join("\n  ")
		: "";

	return `@theme {\n  --*: initial;\n  ${breakpoints}\n  ${fontVariables}\n  ${variables}\n}`;
}

function generateFontFaces(fonts: NonNullable<TokenConfig["fonts"]>): string {
	return Object.entries(fonts)
		.map(([_, font]) => {
			return `@font-face {\n  font-family: "${font["font-family"]}";\n  font-weight: ${font["font-weight"]};\n  font-style: ${font["font-style"]};\n  src: ${font["src"]};\n}`;
		})
		.join("\n\n");
}

function generateComponents(
	components: NonNullable<TokenConfig["components"]>,
	breakpoints: Record<string, string>,
): string {
	const processComponentStyles = (
		baseSelector: string,
		styles: Record<string, unknown>,
	): string[] => {
		const cssRules: string[] = [];

		Object.entries(styles).forEach(([selector, value]) => {
			if (isObject(value)) {
				const rules: string[] = [];

				Object.entries(value).forEach(([prop, propValue]) => {
					if (isObject(propValue) && "default" in propValue) {
						// Handle responsive properties
						rules.push(`    ${prop}: ${propValue.default};`);

						Object.entries(propValue).forEach(([bp, val]) => {
							if (bp !== "default" && breakpoints[bp]) {
								rules.push(`    @media (min-width: ${breakpoints[bp]}) {`);
								rules.push(`      ${prop}: ${val};`);
								rules.push(`    }`);
							}
						});
					} else {
						// Handle regular properties
						rules.push(`    ${prop}: ${propValue};`);
					}
				});

				cssRules.push(`  ${baseSelector}-${selector} {`);
				cssRules.push(rules.join("\n"));
				cssRules.push(`  }`);
			}
		});

		return cssRules;
	};

	const componentRules = Object.entries(components)
		.map(([selector, styles]) => {
			if (isObject(styles)) {
				const processedStyles = processComponentStyles(selector, styles);
				return processedStyles.join("\n");
			}
			return "";
		})
		.filter(Boolean)
		.join("\n\n");

	return `@layer components {\n${componentRules}\n}`;
}

function generateUtilities(
	utilities: NonNullable<TokenConfig["utilities"]>,
	breakpoints: Record<string, string>,
): string {
	const processUtilityStyles = (
		selector: string,
		styles: Record<string, unknown>,
	): string[] => {
		const cssRules: string[] = [];

		Object.entries(styles).forEach(([prop, value]) => {
			if (isObject(value) && "default" in value) {
				cssRules.push(`  ${prop}: ${value.default};`);

				Object.entries(value).forEach(([bp, val]) => {
					if (bp !== "default" && breakpoints[bp]) {
						cssRules.push(`  @media (min-width: ${breakpoints[bp]}) {`);
						cssRules.push(`    ${prop}: ${val};`);
						cssRules.push(`  }`);
					}
				});
			} else if (typeof value === "string" || typeof value === "number") {
				cssRules.push(`  ${prop}: ${value};`);
			}
		});

		return [`@utility ${selector} {`, ...cssRules, `}`];
	};

	return Object.entries(utilities)
		.map(([selector, styles]) => {
			if (isObject(styles)) {
				return processUtilityStyles(selector, styles).join("\n");
			}
			return "";
		})
		.filter(Boolean)
		.join("\n\n");
}

function generateBreakpointVariants(
	breakpoints: Record<string, string>,
): string {
	return Object.entries(breakpoints)
		.map(
			([key, value]) => `@custom-variant ${key} {
  @media (min-width: ${value}) {
    @slot;
  }
}`,
		)
		.join("\n\n");
}

export default function tokensToTw(
	tokenUrl: string = "assets/css/tokens.json",
	outputUrl: string = "assets/css/tokens.css",
): Plugin {
	const tokenPath = path.resolve(tokenUrl);
	const outputPath = path.resolve(outputUrl);

	return {
		name: "tokens-to-tw",
		async buildStart() {
			await generateCSS();
		},
		async hotUpdate({ file, server }) {
			if (file.endsWith("tokens.json")) {
				await generateCSS();
			}
		},
	};

	async function generateCSS() {
		try {
			const tokenContent = await fs.promises.readFile(tokenPath, "utf-8");
			const tokens = JSON.parse(tokenContent) as TokenConfig;

			const cssContent = [
				generateThemeVariables(tokens.theme),
				tokens.fonts ? generateFontFaces(tokens.fonts) : "",
				generateThemeSection(tokens.theme, tokens.fonts),
				generateBreakpointVariants(tokens.theme.breakpoint || {}),
				tokens.components
					? generateComponents(tokens.components, tokens.theme.breakpoint || {})
					: "",
				tokens.utilities
					? generateUtilities(tokens.utilities, tokens.theme.breakpoint || {})
					: "",
				// v-lay from gds-style :')
				`@utility lay {
  display: grid;
  grid-auto-flow: initial;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-rows: minmax(0, auto);
}
@utility lay-v {
  grid-auto-flow: row;
}
@utility lay-h {
    grid-auto-flow: column;
  }
@utility lay-o {
  &>* {
    grid-area: 1 / 1;
  }
}
@utility lay-fluid {
  grid-auto-columns: initial;
  grid-auto-rows: initial;
  justify-content: flex-start;
}`,
			]
				.filter(Boolean)
				.join("\n\n");

			await fs.promises.writeFile(outputPath, cssContent);
		} catch (error) {
			console.error("Error generating CSS:", error);
		}
	}
}
