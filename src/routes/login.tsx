import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { supabase, loadAccount, isLive } from "@/lib/supabase";
import { AuthLayout, Field, ErrorBox, inputCls, btnPrimary } from "@/components/onboarding/ui";
export const Route = createFileRoute("/login")({ component: LoginPage });
function LoginPage() {
 const navigate=useNavigate(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState<string|null>(null); const [busy,setBusy]=useState(false); const [show,setShow]=useState(false);
 const submit=async(e:FormEvent)=>{e.preventDefault();setError(null);setBusy(true);const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error){setBusy(false);return setError(error.message);}const acct=await loadAccount();setBusy(false);navigate({to:acct?.restaurant&&isLive(acct.subscription?.status)?"/dashboard":"/onboarding"});};
 return <AuthLayout mode="login"><div className="mw-auth-heading"><span className="mw-auth-icon"><LockKeyhole size={20}/></span><h1>Welcome back.</h1><p>Sign in to continue setting up and managing your Menu-Wave restaurant.</p></div><form onSubmit={submit}>
 <Field label="Email address"><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className={inputCls} autoComplete="email" placeholder="you@restaurant.com"/></Field>
 <Field label="Password"><div className="mw-password-wrap"><input type={show?"text":"password"} required value={password} onChange={e=>setPassword(e.target.value)} className={inputCls} autoComplete="current-password" placeholder="Your password"/><button type="button" onClick={()=>setShow(!show)} aria-label={show?"Hide password":"Show password"}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></Field>
 <ErrorBox message={error}/><button disabled={busy} className={`${btnPrimary} w-full`}>{busy?"Signing in…":"Sign in →"}</button></form><p className="mw-auth-switch">New to Menu-Wave? <Link to="/register">Start free</Link></p></AuthLayout>;
}
