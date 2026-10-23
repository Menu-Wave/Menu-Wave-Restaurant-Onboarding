import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { callFunction } from "@/lib/supabase";
import { Shell, Card, btnPrimary } from "@/components/onboarding/ui";

export const Route = createFileRoute("/billing/callback")({
  validateSearch: (s: Record<string, unknown>) => ({
    reference: typeof s.reference === "string" ? s.reference : typeof s.trxref === "string" ? s.trxref : undefined,
  }),
  component: Callback,
});

function Callback() {
  const { reference } = Route.useSearch();
  const [state, setState] = useState<"checking" | "success" | "pending" | "error">("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!reference) {
      setState("error");
      setMessage("Missing payment reference.");
      return;
    }
    let cancelled = false;
    (async () => {
      // Card payments confirm instantly, but retry a few times in case Paystack is still settling.
      for (let attempt = 0; attempt < 5 && !cancelled; attempt++) {
        try {
          const r = await callFunction<{ status: string }>("billing-verify", { reference });
          if (r.status === "success") return setState("success");
          setState("pending");
        } catch (err) {
          setState("error");
          setMessage(err instanceof Error ? err.message : "Couldn't verify payment.");
          return;
        }
        await new Promise((res) => setTimeout(res, 2500));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <Shell>
      <Card className="text-center">
        {state === "checking" && <p className="text-slate-600">Confirming your payment…</p>}
        {state === "pending" && <p className="text-slate-600">Waiting for Paystack to confirm. Hang on…</p>}
        {state === "success" && (
          <>
            <h1 className="text-xl font-bold text-slate-900">Payment confirmed 🎉</h1>
            <p className="mt-2 text-sm text-slate-600">Your restaurant is now live.</p>
            <Link to="/onboarding" className={`${btnPrimary} mt-5 inline-block`}>
              Get your QR codes
            </Link>
          </>
        )}
        {state === "error" && (
          <>
            <h1 className="text-xl font-bold text-slate-900">We couldn't confirm the payment</h1>
            <p className="mt-2 text-sm text-red-700">{message}</p>
            <p className="mt-2 text-sm text-slate-500">If you were charged, don't pay again — it will be applied automatically, or contact support with your reference: {reference}</p>
            <Link to="/onboarding" className={`${btnPrimary} mt-5 inline-block`}>
              Back
            </Link>
          </>
        )}
      </Card>
    </Shell>
  );
}
