import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../api/auth.js";
import Button from "../../components/Button.jsx";
import FormField from "../../components/FormField.jsx";
import { PASSWORD_POLICY, isValidPassword } from "../../format.js";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [expired, setExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    const found = {};
    if (!isValidPassword(form.password)) found.password = PASSWORD_POLICY;
    if (form.password !== form.confirm) found.confirm = "Las passwords no coinciden.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    try {
      await resetPassword(token, form.password);
      navigate("/login", { state: { passwordReset: true } });
    } catch (err) {
      if (err.status === 400) setExpired(true);
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <section className="mx-auto max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Enlace no valido</h1>
        <p role="alert" className="text-sm text-red-700">
          El enlace de recuperacion no es valido.
        </p>
        <Link to="/forgot-password" className="text-indigo-700 underline">
          Solicitar un nuevo enlace
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Nueva password</h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          id="password"
          label="Nueva password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={update("password")}
          error={errors.password}
          hint={PASSWORD_POLICY}
          required
        />
        <FormField
          id="confirm"
          label="Confirmar password"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={update("confirm")}
          error={errors.confirm}
          required
        />
        {formError && (
          <p role="alert" className="text-sm text-red-700">
            {formError}
          </p>
        )}
        {expired && (
          <Link to="/forgot-password" className="block text-sm text-indigo-700 underline">
            Solicitar un nuevo enlace
          </Link>
        )}
        <Button type="submit" disabled={submitting} className="w-full">
          Cambiar password
        </Button>
      </form>
    </section>
  );
}
