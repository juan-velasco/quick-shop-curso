import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import {
  borderRadius,
  boxShadow,
  colors,
  fontFamily,
  fontSize,
  minHeight,
  minWidth,
} from "./src/theme/tokens.js";

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          content: ["./index.html", "./src/**/*.{js,jsx}"],
          theme: {
            colors,
            fontFamily,
            fontSize,
            borderRadius,
            boxShadow,
            extend: { minHeight, minWidth },
          },
          plugins: [],
        }),
      ],
    },
  },
  server: { host: "0.0.0.0", port: 5173 },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
    css: false,
  },
});
