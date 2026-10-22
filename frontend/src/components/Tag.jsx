const variants = {
  mint: "bg-aloe text-ink",
  shade: "bg-tag text-ink",
};

export default function Tag({ variant = "shade", className = "", ...props }) {
  return (
    <span
      className={`inline-block rounded-pill px-3 py-1 text-eyebrow ${variants[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
