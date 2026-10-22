// Fuente unica de los tokens de DESIGN.md (pista clara). La consume vite.config.js
// para el tema de Tailwind y src/theme/tokens.test.js para comprobar contrastes.

export const colors = {
  transparent: "transparent",
  current: "currentColor",
  canvas: "#fbfbf5",
  surface: "#ffffff",
  ink: "#000000",
  "on-ink": "#ffffff",
  hairline: "#e4e4e7",
  control: "#71717a",
  muted: "#52525b",
  subtle: "#71717a",
  pressed: "#3f3f46",
  tag: "#d4d4d8",
  aloe: "#c1fbd4",
  pistachio: "#d4f9e0",
  danger: "#b91c1c",
};

const display = '"Inter Variable", Inter, Helvetica, Arial, sans-serif';

export const fontFamily = {
  sans: display,
  mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
};

const type = (size, lineHeight, fontWeight, letterSpacing = "0") => [
  size,
  { lineHeight, fontWeight, letterSpacing },
];

export const fontSize = {
  "display-md": type("3rem", "1.14", "330"),
  "display-md-sm": type("2.25rem", "1.14", "330"),
  "heading-xl": type("1.75rem", "1.28", "500", "0.015em"),
  "heading-lg": type("1.5rem", "1.14", "400", "0.015em"),
  "heading-md": type("1.25rem", "1.4", "500", "0.015em"),
  "heading-sm": type("1.125rem", "1.25", "500", "0.04em"),
  "body-lg": type("1.125rem", "1.56", "550"),
  "body-md": type("1rem", "1.5", "420"),
  "body-strong": type("1rem", "1.5", "550"),
  caption: type("0.875rem", "1.49", "500", "0.02em"),
  micro: type("0.8125rem", "1.5", "500", "-0.01em"),
  eyebrow: type("0.75rem", "1.2", "400", "0.06em"),
};

export const borderRadius = {
  none: "0",
  xs: "4px",
  sm: "5px",
  md: "8px",
  lg: "12px",
  xl: "20px",
  pill: "9999px",
  full: "9999px",
};

export const boxShadow = {
  none: "none",
  card: "0 8px 8px rgba(0,0,0,0.1), 0 4px 4px rgba(0,0,0,0.1), 0 2px 2px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.1)",
  float: "0 25px 50px -12px rgba(0,0,0,0.25)",
};

export const minHeight = { control: "44px" };
export const minWidth = { control: "44px" };

// Parejas texto/fondo y componente/fondo usadas en la interfaz: [primer plano, fondo, minimo].
export const contrastPairs = [
  ["ink", "canvas", 4.5],
  ["ink", "surface", 4.5],
  ["ink", "aloe", 4.5],
  ["ink", "pistachio", 4.5],
  ["ink", "tag", 4.5],
  ["on-ink", "ink", 4.5],
  ["on-ink", "pressed", 4.5],
  ["on-ink", "danger", 4.5],
  ["muted", "canvas", 4.5],
  ["muted", "surface", 4.5],
  ["subtle", "canvas", 4.5],
  ["subtle", "surface", 4.5],
  ["danger", "canvas", 4.5],
  ["danger", "surface", 4.5],
  ["control", "canvas", 3],
  ["control", "surface", 3],
  ["ink", "canvas", 3],
];

// Colores prohibidos como texto sobre fondos claros (contraste insuficiente).
export const forbiddenTextColors = ["#a1a1aa", "#d4d4d8", "#e4e4e7"];
