const variants = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "border border-gray-300 bg-white text-gray-800 hover:bg-gray-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export default function Button({ variant = "primary", className = "", ...props }) {
  return (
    <button
      type="button"
      className={`rounded px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
