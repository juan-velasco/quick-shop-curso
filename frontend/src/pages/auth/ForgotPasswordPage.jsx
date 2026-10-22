import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/auth.js";
import Button from "../../components/Button.jsx";
import FormField from "../../components/FormField.jsx";
import Notice from "../../components/Notice.jsx";

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
    <section className="mx-auto max-w-sm space-y-4 rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8">
      <h1 className="text-heading-xl">Recuperar password</h1>
      {sent ? (
        <Notice>{CONFIRMATION}</Notice>
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
            <p role="alert" className="text-caption font-semibold text-danger">
              {error}
            </p>
          )}
          <Button type="submit" disabled={submitting} className="w-full">
            Enviar enlace
          </Button>
        </form>
      )}
      <p className="text-caption">
        <Link to="/login" className="text-ink underline underline-offset-4">
          Volver a iniciar sesion
        </Link>
      </p>
    </section>
  );
}
