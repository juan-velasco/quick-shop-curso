const styles = {
  loading: "text-gray-600",
  empty: "text-gray-600",
  error: "text-red-700",
};

export default function StateMessage({ kind, children }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`py-8 text-center ${styles[kind] ?? styles.empty}`}
    >
      {children}
    </p>
  );
}
