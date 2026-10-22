import { describe, expect, it } from "vitest";
import { colors, contrastPairs, forbiddenTextColors } from "./tokens.js";

function luminance(hex) {
  const channels = [1, 3, 5].map((index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrast(foreground, background) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

describe("tokens de diseno", () => {
  it("el contraste calculado es correcto en los extremos", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrast("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it.each(contrastPairs)("%s sobre %s alcanza %s:1", (foreground, background, minimum) => {
    expect(contrast(colors[foreground], colors[background])).toBeGreaterThanOrEqual(minimum);
  });

  it("ningun color de texto es uno de los grises prohibidos", () => {
    const textColors = ["ink", "on-ink", "muted", "subtle", "danger"].map((name) => colors[name]);
    for (const color of textColors) expect(forbiddenTextColors).not.toContain(color);
  });

  it("no hay un tercer canvas: solo crema y blanco", () => {
    expect([colors.canvas, colors.surface]).toEqual(["#fbfbf5", "#ffffff"]);
  });
});
