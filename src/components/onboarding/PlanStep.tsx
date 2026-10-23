import { useEffect, useState } from "react";
import { supabase, naira, type Plan, type Restaurant } from "@/lib/supabase";
import { Card, ErrorBox, btnPrimary, btnGhost } from "./ui";

const labels: Record<string, string> = {
  online_ordering: "Online ordering", qr_ordering: "QR ordering", cashier_dashboard: "Cashier dashboard",
  kitchen_display: "Kitchen display", order_tracking: "Order tracking", basic_sales_statistics: "Basic sales statistics",
  advanced_analytics: "Advanced sales analytics", ai_analysis: "AI sales summaries & recommendations",
  ai_chatbot: "Menu-Wave AI Assistant", revenue_forecasting: "Revenue forecasting",
  demand_forecasting: "Customer demand forecasting", priority_support: "Priority support",
};

export function PlanStep({ restaurant, itemCount, onBack, onStarted }: { restaurant: Restaurant; itemCount: number; onBack: () => void; onStarted: () => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("subscription_plans")
      .select("id, code, name, description, monthly_price_kobo, features, limits, display_order")
      .eq("is_active", true).order("display_order")
      .then(({ data, error }) => error ? setError(error.message) : setPlans((data as Plan[]) ?? []));
  }, []);

  const choose = async (plan: Plan) => {
    setBusy(plan.code); setError(null);
    try {
      const menuLimit = Number(plan.limits?.menu_items ?? 0);
      const tableLimit = Number(plan.limits?.tables ?? 0);
      if ((menuLimit && itemCount > menuLimit) || (tableLimit && restaurant.table_count > tableLimit)) throw new Error("Your restaurant is above this plan's limits.");
      const { error: rpcError } = await supabase.rpc("select_trial_plan", { p_plan_code: plan.code });
      if (rpcError) throw rpcError;
      onStarted();
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't select plan"); setBusy(null); }
  };

  return <div>
    <Card className="mb-5"><h2 className="mb-1 text-xl font-bold text-slate-900">Choose your plan</h2>
      <p className="text-sm text-slate-500">Start with a 14-day free trial. Choose the plan you want to evaluate; billing begins only when you subscribe after the trial.</p></Card>
    <ErrorBox message={error} />
    <div className="grid gap-4 sm:grid-cols-3">{plans.map((p) => {
      const menuLimit=Number(p.limits?.menu_items ?? 0), tableLimit=Number(p.limits?.tables ?? 0);
      const tooSmall=(menuLimit>0&&itemCount>menuLimit)||(tableLimit>0&&restaurant.table_count>tableLimit);
      const featureList=Object.entries(p.features ?? {}).filter(([,v])=>v).map(([k])=>labels[k] ?? k.replaceAll("_"," "));
      return <div key={p.id} className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${p.code === "growth" ? "border-red-500 ring-1 ring-red-500" : "border-slate-200"}`}>
        {p.code === "growth" && <span className="absolute -top-3 left-4 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">Recommended</span>}
        <h3 className="text-lg font-bold text-slate-900">{p.name}</h3><p className="mt-1 text-sm text-slate-500">{p.description}</p>
        <p className="mt-3 text-2xl font-extrabold text-slate-900">{naira(p.monthly_price_kobo/100)}<span className="text-sm font-medium text-slate-500"> /mo</span></p>
        <p className="mt-2 text-sm text-slate-600">Up to {menuLimit} items · {tableLimit} tables</p>
        <ul className="mt-3 flex-1 space-y-1 text-sm text-slate-700">{featureList.map(f=><li key={f}>✓ {f}</li>)}</ul>
        {tooSmall && <p className="mt-3 text-xs text-amber-700">Your menu or table count is above this plan's limits.</p>}
        <button onClick={()=>choose(p)} disabled={!!busy||tooSmall} className={`${btnPrimary} mt-4`}>{busy===p.code?"Starting…":`Start ${p.name} trial`}</button>
      </div>})}</div>
    <div className="mt-5"><button onClick={onBack} className={btnGhost}>Back to menu</button></div>
  </div>;
}
