import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Shell, Card, Field, ErrorBox, inputCls, btnPrimary } from "@/components/onboarding/ui";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    });
    setBusy(false);
    if (error) return setError(error.message);
    if (data.session) navigate({ to: "/onboarding" });
    else setCheckEmail(true); // email confirmation is enabled in Supabase
  };

  if (checkEmail) {
    return (
      <Shell>
        <Card>
          <h1 className="text-xl font-bold text-slate-900">Check your email</h1>
          <p className="mt-2 text-sm text-slate-600">
            We sent a confirmation link to <b>{email}</b>. Open it to continue setting up your restaurant.
          </p>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card>
        <h1 className="mb-1 text-xl font-bold text-slate-900">Create your account</h1>
        <p className="mb-6 text-sm text-slate-500">You'll set up your restaurant and menu next.</p>
        <form onSubmit={submit}>
          <Field label="Email">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
          </Field>
          <Field label="Password" hint="At least 8 characters">
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete="new-password" />
          </Field>
          <Field label="Confirm password">
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} autoComplete="new-password" />
          </Field>
          <ErrorBox message={error} />
          <button disabled={busy} className={`${btnPrimary} w-full`}>
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-red-600">
            Log in
          </Link>
        </p>
      </Card>
    </Shell>
  );
}
