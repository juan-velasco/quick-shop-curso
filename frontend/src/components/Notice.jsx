const variants = {
  success: "bg-aloe",
  info: "bg-pistachio",
};

export default function Notice({ variant = "success", className = "", ...props }) {
  return (
    <p
      role="status"
      className={`rounded-lg px-4 py-3 text-caption text-ink ${variants[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
