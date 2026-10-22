import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/Button.jsx";
import FormField from "../../components/FormField.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import Notice from "../../components/Notice.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "admin" ? "/admin/products" : "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-sm space-y-4 rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8">
      <h1 className="text-heading-xl">Iniciar sesion</h1>
      {location.state?.registered && (
        <Notice>
          Cuenta creada. Ya puedes iniciar sesion.
        </Notice>
      )}
      {location.state?.passwordReset && (
        <Notice>
          Password actualizada. Ya puedes iniciar sesion.
        </Notice>
      )}
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
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error && (
          <p role="alert" className="text-caption font-semibold text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={submitting} className="w-full">
          Entrar
        </Button>
      </form>
      <p className="text-caption">
        <Link to="/forgot-password" className="text-ink underline underline-offset-4">
          Has olvidado tu password?
        </Link>
      </p>
      <p className="text-caption">
        No tienes cuenta?{" "}
        <Link to="/register" className="text-ink underline underline-offset-4">
          Registrate
        </Link>
      </p>
    </section>
  );
}
