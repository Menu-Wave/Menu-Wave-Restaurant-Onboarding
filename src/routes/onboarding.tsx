import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/use-account";
import { isLive, supabase } from "@/lib/supabase";
import { Shell } from "@/components/onboarding/ui";
import { RestaurantStep } from "@/components/onboarding/RestaurantStep";
import { PlanStep } from "@/components/onboarding/PlanStep";
import { GoLive } from "@/components/onboarding/GoLive";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

type Step = "restaurant" | "plan" | "live";

const STEPS: { key: Step; label: string }[] = [
  { key: "restaurant", label: "Restaurant" },
  { key: "plan", label: "Plan" },
  { key: "live", label: "Go live" },
];

function Onboarding() {
  const navigate = useNavigate();
  const { account, loading, refresh } = useAccount();
  const [step, setStep] = useState<Step | null>(null);

  // Resume onboarding from the correct point.
  useEffect(() => {
    if (!account || step) return;

    if (!account.restaurant) {
      setStep("restaurant");
    } else if (isLive(account.subscription?.status)) {
      setStep("live");
    } else {
      setStep("plan");
    }
  }, [account, step]);

  if (loading || !account || !step) {
    return (
      <div className="grid h-screen place-items-center text-slate-400">
        Loading…
      </div>
    );
  }

  const idx = STEPS.findIndex((s) => s.key === step);
  const restaurant = account.restaurant;

  return (
    <Shell>
      <ol className="mb-8 flex gap-2">
        {STEPS.map((s, i) => (
          <li
            key={s.key}
            className={`flex-1 border-t-4 pt-2 text-xs font-bold ${
              i <= idx
                ? "border-red-600 text-slate-900"
                : "border-slate-200 text-slate-400"
            }`}
          >
            {i + 1}. {s.label}
          </li>
        ))}
      </ol>

      {step === "restaurant" && (
        <RestaurantStep
          onDone={async () => {
            await refresh();
            setStep("plan");
          }}
        />
      )}

      {step === "plan" && restaurant && (
        <PlanStep
          restaurant={restaurant}
          itemCount={account.itemCount}
          onBack={() => setStep("restaurant")}
          onStarted={async () => {
            await refresh();
            setStep("live");
          }}
        />
      )}

      {step === "live" && restaurant && (
        <>
          <GoLive
            restaurant={restaurant}
            live={isLive(account.subscription?.status)}
          />

          <div className="mt-6 flex gap-3 print:hidden">
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="text-sm font-semibold text-red-600"
            >
              Go to dashboard
            </button>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/" });
              }}
              className="text-sm font-semibold text-slate-500"
            >
              Log out
            </button>
          </div>
        </>
      )}
    </Shell>
  );
}