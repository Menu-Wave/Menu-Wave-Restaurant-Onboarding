// Called from the /billing/callback page. Verifies the transaction with Paystack and applies it.
// Deploy: supabase functions deploy billing-verify   (JWT verification ON)
import { adminClient, applySuccessfulCharge, cors, json, paystack, requireManager } from "../_shared/common.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "Method not allowed" });

  const admin = adminClient();
  const auth = await requireManager(req, admin);
  if ("error" in auth) return auth.error;

  const { reference } = await req.json().catch(() => ({}));
  if (!reference || typeof reference !== "string") return json(req, 400, { error: "Missing reference" });

  const { ok, body } = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
  if (!ok) return json(req, 502, { error: "Couldn't verify payment yet. Please refresh in a moment." });

  const tx = body.data;
  // A manager may only claim their own payment.
  if (Number(tx?.metadata?.restaurant_id) !== auth.restaurantId) return json(req, 403, { error: "This payment belongs to another account" });
  if (tx.status !== "success") return json(req, 200, { status: tx.status ?? "pending" });

  const result = await applySuccessfulCharge(admin, tx);
  if (!result.ok) return json(req, 422, { error: `Payment received but couldn't be applied (${result.reason}). Contact support with reference ${reference}.` });
  return json(req, 200, { status: "success", tier: (result as any).tier ?? null });
});
