import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../../api/auth.js";
import Button from "../../components/Button.jsx";
import FormField from "../../components/FormField.jsx";
import { PASSWORD_POLICY, isValidPassword } from "../../format.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", full_name: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  function validate() {
    const next = {};
    if (!form.email.trim()) next.email = "El email es obligatorio.";
    if (!form.full_name.trim() || form.full_name.length > 120) {
      next.full_name = "El nombre es obligatorio (maximo 120 caracteres).";
    }
    if (!isValidPassword(form.password)) next.password = PASSWORD_POLICY;
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    try {
      await register({ ...form, full_name: form.full_name.trim() });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-sm space-y-4 rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8">
      <h1 className="text-heading-xl">Crear cuenta</h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={update("email")}
          error={errors.email}
          required
        />
        <FormField
          id="full_name"
          label="Nombre"
          type="text"
          autoComplete="name"
          value={form.full_name}
          onChange={update("full_name")}
          error={errors.full_name}
          required
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={update("password")}
          error={errors.password}
          hint={PASSWORD_POLICY}
          required
        />
        {formError && (
          <p role="alert" className="text-caption font-semibold text-danger">
            {formError}
          </p>
        )}
        <Button type="submit" disabled={submitting} className="w-full">
          Registrarse
        </Button>
      </form>
      <p className="text-caption">
        Ya tienes cuenta?{" "}
        <Link to="/login" className="text-ink underline underline-offset-4">
          Inicia sesion
        </Link>
      </p>
    </section>
  );
}
