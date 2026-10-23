import { useEffect, useState } from "react";
import { supabase, naira, type Plan, type Restaurant } from "@/lib/supabase";
import { Card, ErrorBox, btnPrimary, btnGhost } from "./ui";
import { Check, Sparkles } from "lucide-react";

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

  return <div className="mw-plan-step">
    <Card className="mw-plan-intro"><div className="mw-step-heading"><span><Sparkles size={21}/></span><div><p className="mw-kicker">14-DAY FREE TRIAL</p><h2>Choose what you want to explore.</h2><p>No card required today. Your plan only starts billing after the trial when you subscribe.</p></div></div></Card>
    <ErrorBox message={error} />
    <div className="mw-plan-grid">{plans.map((p) => {
      const menuLimit=Number(p.limits?.menu_items ?? 0), tableLimit=Number(p.limits?.tables ?? 0);
      const tooSmall=(menuLimit>0&&itemCount>menuLimit)||(tableLimit>0&&restaurant.table_count>tableLimit);
      const featureList=Object.entries(p.features ?? {}).filter(([,v])=>v).map(([k])=>labels[k] ?? k.replaceAll("_"," "));
      return <div key={p.id} className={`mw-plan-card ${p.code === "growth" ? "mw-plan-featured" : ""}`}>
        {p.code === "growth" && <span className="mw-plan-badge">MOST POPULAR</span>}
        <p className="mw-plan-name">{p.name}</p><p className="mw-plan-desc">{p.description}</p>
        <p className="mw-plan-price">{naira(p.monthly_price_kobo/100)}<span>/month</span></p>
        <p className="mw-plan-limit">Up to {menuLimit} menu items · {tableLimit} tables</p>
        <ul>{featureList.map(f=><li key={f}><Check size={15}/>{f}</li>)}</ul>
        {tooSmall && <p className="mw-plan-warning">Your menu or table count is above this plan's limits.</p>}
        <button onClick={()=>choose(p)} disabled={!!busy||tooSmall} className={`${btnPrimary} w-full`}>{busy===p.code?"Starting your trial…":`Start ${p.name} trial →`}</button>
      </div>})}</div>
    <div className="mw-plan-back"><button onClick={onBack} className={btnGhost}>← Back to restaurant</button></div>
  </div>;
}
