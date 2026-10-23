import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/use-account";
import { callFunction, isLive, naira, supabase } from "@/lib/supabase";
import { Shell, Card, ErrorBox, btnPrimary, btnGhost } from "@/components/onboarding/ui";
import { GoLive } from "@/components/onboarding/GoLive";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

const LABEL: Record<string, { text: string; cls: string }> = {
  active: { text: "Active", cls: "bg-green-100 text-green-800" },
  grandfathered: { text: "Active (legacy)", cls: "bg-green-100 text-green-800" },
  past_due: { text: "Payment failed", cls: "bg-amber-100 text-amber-800" },
  cancelled: { text: "Cancelled", cls: "bg-slate-200 text-slate-700" },
  incomplete: { text: "Not subscribed", cls: "bg-slate-200 text-slate-700" },
};

function Dashboard() {
  const navigate = useNavigate();
  const { account, loading } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const needsOnboarding = !!account && !account.restaurant;
  useEffect(() => {
    if (needsOnboarding) navigate({ to: "/onboarding" });
  }, [needsOnboarding, navigate]);

  if (loading || !account || !account.restaurant) {
    return <div className="grid h-screen place-items-center text-slate-400">Loading…</div>;
  }
  const { restaurant, subscription } = account;
  const status = subscription?.status ?? "incomplete";
  const badge = LABEL[status] ?? LABEL.incomplete;

  const manage = async () => {
    setError(null);
    setBusy(true);
    try {
      const { link } = await callFunction<{ link: string }>("billing-portal");
      window.open(link, "_blank", "noopener");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't open subscription settings");
    }
    setBusy(false);
  };

  return (
    <Shell wide>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-extrabold text-slate-900">{restaurant.name}</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate({ to: "/onboarding" })} className={btnGhost}>
            Edit menu
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
            className={btnGhost}
          >
            Log out
          </button>
        </div>
      </div>

      <Card className="mb-5 print:hidden">
        <ErrorBox message={error} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge.cls}`}>{badge.text}</span>
            <p className="mt-2 text-sm text-slate-600">
              Plan: <b>{subscription?.tier ?? restaurant.tier}</b>
              {subscription?.current_period_end && status !== "grandfathered" && (
                <> · {status === "cancelled" ? "Ends" : "Renews"} {new Date(subscription.current_period_end).toLocaleDateString()}</>
              )}
            </p>
            {status === "past_due" && (
              <p className="mt-1 text-sm text-amber-700">Your last payment failed. Update your card to keep your restaurant live.</p>
            )}
          </div>
          <div className="flex gap-2">
            {status === "incomplete" || status === "cancelled" ? (
              <button onClick={() => navigate({ to: "/onboarding" })} className={btnPrimary}>
                Subscribe
              </button>
            ) : status !== "grandfathered" ? (
              <button onClick={manage} disabled={busy} className={btnPrimary}>
                Manage subscription
              </button>
            ) : null}
          </div>
        </div>
      </Card>

      <GoLive restaurant={restaurant} live={isLive(status)} />
    </Shell>
  );
}
