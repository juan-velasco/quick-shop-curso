const styles = {
  loading: "text-muted",
  empty: "text-muted",
  error: "text-danger font-semibold",
};

export default function StateMessage({ kind, children }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`py-8 text-center text-body-md ${styles[kind] ?? styles.empty}`}
    >
      {children}
    </p>
  );
}
