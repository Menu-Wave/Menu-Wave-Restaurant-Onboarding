// Returns a Paystack-hosted link where the manager can update their card or cancel.
// Deploy: supabase functions deploy billing-portal   (JWT verification ON)
import { adminClient, cors, json, paystack, requireManager } from "../_shared/common.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  const admin = adminClient();
  const auth = await requireManager(req, admin);
  if ("error" in auth) return auth.error;

  const { data: sub } = await admin.from("subscriptions").select("paystack_subscription_code").eq("restaurant_id", auth.restaurantId).maybeSingle();
  if (!sub?.paystack_subscription_code) return json(req, 404, { error: "No Paystack subscription found yet. It can take a minute after payment." });

  const { ok, body } = await paystack(`/subscription/${sub.paystack_subscription_code}/manage/link`);
  if (!ok) return json(req, 502, { error: "Couldn't open subscription settings" });
  return json(req, 200, { link: body.data.link });
});
