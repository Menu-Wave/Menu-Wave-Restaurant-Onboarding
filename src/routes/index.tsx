import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, naira, type Plan } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Menu-Wave — QR ordering for restaurants" }] }),
  component: Landing,
});

function Landing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  useEffect(() => {
    supabase
      .from("subscription_plans")
      .select("id, code, name, description, monthly_price_kobo, features, limits, display_order")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => setPlans((data as Plan[]) ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <span className="text-lg font-extrabold text-slate-900">🍽️ Menu-Wave</span>
        <nav className="flex gap-2">
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Log in
          </Link>
          <Link to="/register" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Let guests order from their table. No app, no waiting.
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Guests scan a QR code, build their meal, and order. Your cashier and kitchen see it instantly.
        </p>
        <Link to="/register" className="mt-8 inline-block rounded-xl bg-red-600 px-6 py-3 text-base font-bold text-white hover:bg-red-700">
          Set up your restaurant
        </Link>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-12 sm:grid-cols-3">
        {[
          ["1. Register", "Create your account and your restaurant's ordering link."],
          ["2. Add your menu", "Type items in, paste from a spreadsheet, and add photos."],
          ["3. Start your trial", "Choose a plan, enjoy 14 days free, then subscribe monthly with Paystack."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-slate-900">{t}</h3>
            <p className="mt-1 text-sm text-slate-600">{d}</p>
          </div>
        ))}
      </section>

      <section id="pricing" className="mx-auto max-w-5xl px-5 pb-20">
        <h2 className="mb-6 text-center text-2xl font-extrabold text-slate-900">Simple monthly pricing</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">
                {naira(p.monthly_price_kobo / 100)}
                <span className="text-sm font-medium text-slate-500"> /month</span>
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Up to {Number(p.limits?.menu_items ?? 0)} menu items · {Number(p.limits?.tables ?? 0)} tables
              </p>
              <ul className="mt-4 space-y-1 text-sm text-slate-700">
                {Object.entries(p.features ?? {}).filter(([, enabled]) => enabled).slice(0, 6).map(([feature]) => (
                  <li key={feature}>✓ {feature.replaceAll("_", " ")}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
