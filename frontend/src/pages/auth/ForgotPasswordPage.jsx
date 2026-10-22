import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/auth.js";
import Button from "../../components/Button.jsx";
import FormField from "../../components/FormField.jsx";

const CONFIRMATION =
  "Si el email existe, recibiras un enlace de recuperacion. Revisa tu bandeja de entrada.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("El email es obligatorio.");
      return;
    }
    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Recuperar password</h1>
      {sent ? (
        <p role="status" className="rounded bg-green-100 p-2 text-sm text-green-800">
          {CONFIRMATION}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" disabled={submitting} className="w-full">
            Enviar enlace
          </Button>
        </form>
      )}
      <p className="text-sm">
        <Link to="/login" className="text-indigo-700 underline">
          Volver a iniciar sesion
        </Link>
      </p>
    </section>
  );
}
