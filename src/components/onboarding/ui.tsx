import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChefHat, QrCode, ReceiptText, Smartphone, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";

export const inputCls = "mw-input";
export const btnPrimary = "mw-btn-primary";
export const btnGhost = "mw-btn-ghost";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <Link to="/" className="mw-brand" aria-label="Menu-Wave home"><img src="/menu-wave-logo.png" className="mw-brand-mark" alt="" aria-hidden="true" />{!compact && <span>Menu-Wave</span>}</Link>;
}

const flow = [
  { icon: QrCode, label: "Scan" },
  { icon: Smartphone, label: "Order" },
  { icon: ReceiptText, label: "Receive" },
  { icon: ChefHat, label: "Prepare" },
  { icon: UtensilsCrossed, label: "Serve" },
];

export function FlowVisual({ title = "One order. One smooth flow." }: { title?: string }) {
  return <div className="mw-flow-visual" aria-hidden="true">
    <div className="mw-flow-glow mw-flow-glow-a" /><div className="mw-flow-glow mw-flow-glow-b" />
    <div className="mw-flow-copy"><span className="mw-eyebrow-light">HOW MENU-WAVE MOVES</span><h2>{title}</h2><p>From the table to the kitchen and back to the customer — without paper tickets getting in the way.</p></div>
    <div className="mw-m-stage">
      <svg className="mw-m-path" viewBox="0 0 720 250" fill="none" preserveAspectRatio="none">
        <path d="M42 193 C95 40 145 39 198 191 C250 38 302 38 355 191 C408 40 460 40 512 191 C560 66 615 61 680 167" stroke="rgba(255,255,255,.12)" strokeWidth="18" strokeLinecap="round"/>
        <motion.path d="M42 193 C95 40 145 39 198 191 C250 38 302 38 355 191 C408 40 460 40 512 191 C560 66 615 61 680 167" stroke="url(#waveGradient)" strokeWidth="7" strokeLinecap="round" pathLength="1" initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:2.8, repeat:Infinity, repeatDelay:.5, ease:"easeInOut"}}/>
        <defs><linearGradient id="waveGradient"><stop stopColor="#2563EB"/><stop offset=".55" stopColor="#38BDF8"/><stop offset="1" stopColor="#F59E0B"/></linearGradient></defs>
      </svg>
      <motion.span className="mw-flow-dot" animate={{offsetDistance:["0%","100%"]}} transition={{duration:4.2,repeat:Infinity,ease:"easeInOut"}} />
      <div className="mw-flow-icons">{flow.map(({icon:Icon,label},i)=><motion.div key={label} className="mw-flow-node" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.25+i*.13}}><span><Icon size={18}/></span><small>{label}</small></motion.div>)}</div>
    </div>
  </div>;
}

export function AuthLayout({ children, mode }: { children: ReactNode; mode: "login" | "register" | "verify" }) {
  return <div className="mw-auth-page">
    <aside className="mw-auth-art"><BrandMark/><FlowVisual title={mode === "login" ? "Pick up right where service left off." : mode === "verify" ? "One quick check, then your restaurant flows." : "Set up once. Let every order flow."}/></aside>
    <main className="mw-auth-main"><div className="mw-auth-mobile-brand"><BrandMark/></div><div className="mw-auth-card">{children}</div><p className="mw-auth-foot">Built for smoother restaurant service.</p></main>
  </div>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="mw-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
export function ErrorBox({ message }: { message: string | null }) { return message ? <p className="mw-error">{message}</p> : null; }
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className={`mw-card ${className}`}>{children}</div>; }
export function Shell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className="mw-onboard-shell"><header className="mw-shell-header"><div className={wide ? "mw-shell-inner mw-shell-wide" : "mw-shell-inner"}><BrandMark/><span className="mw-shell-note">Restaurant setup</span></div></header><main className={wide ? "mw-shell-main mw-shell-wide" : "mw-shell-main"}>{children}</main></div>;
}
