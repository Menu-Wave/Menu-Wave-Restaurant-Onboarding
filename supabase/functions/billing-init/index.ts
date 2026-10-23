// Starts a Paystack subscription checkout for the signed-in restaurant manager.
// Deploy: supabase functions deploy billing-init   (JWT verification ON)
import { adminClient, cors, json, paystack, requireManager } from "../_shared/common.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "Method not allowed" });

  const admin = adminClient();
  const auth = await requireManager(req, admin);
  if ("error" in auth) return auth.error;

  const { tier } = await req.json().catch(() => ({}));
  const { data: plan } = await admin.from("plans").select("*").eq("tier", String(tier)).eq("is_public", true).maybeSingle();
  if (!plan) return json(req, 400, { error: "Unknown plan" });
  if (!plan.paystack_plan_code) return json(req, 500, { error: "This plan isn't configured for billing yet" });

  const { data: restaurant } = await admin.from("restaurants").select("id, table_count").eq("id", auth.restaurantId).single();
  if (!restaurant) return json(req, 404, { error: "Restaurant not found" });
  if (restaurant.table_count > plan.max_tables) {
    return json(req, 400, { error: `The ${plan.name} plan supports up to ${plan.max_tables} tables. Pick a bigger plan.` });
  }

  const { data: sub } = await admin.from("subscriptions").select("status").eq("restaurant_id", auth.restaurantId).maybeSingle();
  if (sub && ["active", "grandfathered"].includes(sub.status)) {
    return json(req, 409, { error: "You already have an active subscription. Use Manage subscription, or contact support to change plan." });
  }

  const appUrl = (Deno.env.get("ONBOARDING_URL") ?? "").replace(/\/$/, "");
  const { ok, body } = await paystack("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: auth.user.email,
      amount: plan.price_ngn * 100, // overridden by the plan's amount, kept as a sanity value
      plan: plan.paystack_plan_code,
      callback_url: `${appUrl}/billing/callback`,
      metadata: { restaurant_id: auth.restaurantId, tier: plan.tier },
    }),
  });
  if (!ok) {
    console.error("Paystack init failed", body);
    return json(req, 502, { error: "Couldn't start payment. Please try again." });
  }
  return json(req, 200, { authorization_url: body.data.authorization_url, reference: body.data.reference });
});
