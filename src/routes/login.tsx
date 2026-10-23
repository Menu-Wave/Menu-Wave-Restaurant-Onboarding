import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase, loadAccount, isLive } from "@/lib/supabase";
import { Shell, Card, Field, ErrorBox, inputCls, btnPrimary } from "@/components/onboarding/ui";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    const acct = await loadAccount();
    setBusy(false);
    navigate({ to: acct?.restaurant && isLive(acct.subscription?.status) ? "/dashboard" : "/onboarding" });
  };

  return (
    <Shell>
      <Card>
        <h1 className="mb-6 text-xl font-bold text-slate-900">Log in</h1>
        <form onSubmit={submit}>
          <Field label="Email">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
          </Field>
          <Field label="Password">
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete="current-password" />
          </Field>
          <ErrorBox message={error} />
          <button disabled={busy} className={`${btnPrimary} w-full`}>
            {busy ? "Signing in…" : "Log in"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          New here?{" "}
          <Link to="/register" className="font-semibold text-red-600">
            Create an account
          </Link>
        </p>
      </Card>
    </Shell>
  );
}
