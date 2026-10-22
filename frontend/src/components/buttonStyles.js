const base =
  "inline-flex min-h-control items-center justify-center rounded-pill px-6 py-3 text-body-md transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: "bg-ink text-on-ink enabled:hover:bg-pressed enabled:active:bg-pressed",
  secondary:
    "border border-ink bg-surface text-ink enabled:hover:bg-canvas enabled:active:bg-hairline",
  aloe: "bg-aloe text-ink enabled:hover:bg-pistachio enabled:active:bg-pistachio",
  danger: "bg-danger text-on-ink enabled:hover:bg-pressed enabled:active:bg-pressed",
};

export function buttonClasses(variant = "primary", className = "") {
  return `${base} ${variants[variant]} ${className}`.trim();
}
