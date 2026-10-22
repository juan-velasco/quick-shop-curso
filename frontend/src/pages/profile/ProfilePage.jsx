import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../../api/users.js";
import Button from "../../components/Button.jsx";
import FormField from "../../components/FormField.jsx";
import StateMessage from "../../components/StateMessage.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { PASSWORD_POLICY, isValidPassword } from "../../format.js";
import { useFetch } from "../../useFetch.js";
import Notice from "../../components/Notice.jsx";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { data: profile, loading, error } = useFetch(getProfile, []);
  const [fullName, setFullName] = useState("");
  const [nameMessage, setNameMessage] = useState({ kind: "", text: "" });
  const [passwords, setPasswords] = useState({ current_password: "", password: "" });
  const [passwordMessage, setPasswordMessage] = useState({ kind: "", text: "" });

  useEffect(() => {
    if (profile) setFullName(profile.full_name);
  }, [profile]);

  if (loading) return <StateMessage kind="loading">Cargando perfil...</StateMessage>;
  if (error) return <StateMessage kind="error">{error}</StateMessage>;

  async function handleName(event) {
    event.preventDefault();
    setNameMessage({ kind: "", text: "" });
    if (!fullName.trim() || fullName.length > 120) {
      setNameMessage({ kind: "error", text: "El nombre es obligatorio (maximo 120 caracteres)." });
      return;
    }
    try {
      const updated = await updateProfile({ full_name: fullName.trim() });
      setUser({ ...user, full_name: updated.full_name });
      setNameMessage({ kind: "ok", text: "Nombre actualizado." });
    } catch (err) {
      setNameMessage({ kind: "error", text: err.message });
    }
  }

  async function handlePassword(event) {
    event.preventDefault();
    setPasswordMessage({ kind: "", text: "" });
    if (!isValidPassword(passwords.password)) {
      setPasswordMessage({ kind: "error", text: PASSWORD_POLICY });
      return;
    }
    try {
      await updateProfile(passwords);
      setPasswords({ current_password: "", password: "" });
      setPasswordMessage({ kind: "ok", text: "Password actualizada." });
    } catch (err) {
      setPasswordMessage({ kind: "error", text: err.message });
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-8">
      <h1 className="text-heading-xl">Mi perfil</h1>

      <form onSubmit={handleName} className="space-y-4 rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8" noValidate>
        <FormField id="profile-email" label="Email" value={profile.email} readOnly disabled />
        <FormField
          id="profile-name"
          label="Nombre"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
        {nameMessage.text &&
          (nameMessage.kind === "error" ? (
            <p role="alert" className="text-caption font-semibold text-danger">
              {nameMessage.text}
            </p>
          ) : (
            <Notice>{nameMessage.text}</Notice>
          ))}
        <Button type="submit">Guardar nombre</Button>
      </form>

      <form onSubmit={handlePassword} className="space-y-4 rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8" noValidate>
        <h2 className="text-heading-md">Cambiar password</h2>
        <FormField
          id="current-password"
          label="Password actual"
          type="password"
          autoComplete="current-password"
          value={passwords.current_password}
          onChange={(event) => setPasswords({ ...passwords, current_password: event.target.value })}
        />
        <FormField
          id="new-password"
          label="Nueva password"
          type="password"
          autoComplete="new-password"
          hint={PASSWORD_POLICY}
          value={passwords.password}
          onChange={(event) => setPasswords({ ...passwords, password: event.target.value })}
        />
        {passwordMessage.text &&
          (passwordMessage.kind === "error" ? (
            <p role="alert" className="text-caption font-semibold text-danger">
              {passwordMessage.text}
            </p>
          ) : (
            <Notice>{passwordMessage.text}</Notice>
          ))}
        <Button type="submit">Cambiar password</Button>
      </form>
    </section>
  );
}
