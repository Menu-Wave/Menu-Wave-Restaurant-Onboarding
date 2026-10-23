import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// Set ALLOWED_ORIGINS (comma separated) in Supabase secrets, e.g. "https://register.menuwave.app".
export function cors(req: Request) {
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.get("origin") ?? "";
  const allow = allowed.length === 0 ? "*" : allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": allow,
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

export function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });
}

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
}

// Returns the authenticated user + their manager staff row, or an error Response.
export async function requireManager(req: Request, admin: SupabaseClient) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return { error: json(req, 401, { error: "Sign in required" }) } as const;
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return { error: json(req, 401, { error: "Invalid session" }) } as const;
  const { data: staff } = await admin.from("staff").select("restaurant_id, role").eq("id", user.id).maybeSingle();
  if (!staff || !["manager", "platform_admin"].includes(String(staff.role))) {
    return { error: json(req, 403, { error: "Only the restaurant manager can manage billing" }) } as const;
  }
  return { user, restaurantId: Number(staff.restaurant_id) } as const;
}

export async function paystack(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok && body?.status !== false, body };
}

function addMonth(d: Date) {
  const n = new Date(d);
  n.setMonth(n.getMonth() + 1);
  return n;
}

// Applies a successful Paystack charge. Idempotent per transaction reference.
// Used by both the webhook and billing-verify, so they can never disagree.
export async function applySuccessfulCharge(admin: SupabaseClient, tx: any) {
  const reference = String(tx.reference ?? "");
  if (!reference || tx.status !== "success") return { ok: false, reason: "not a successful charge" };

  // 1. Resolve restaurant: metadata first (initial payment), else the Paystack customer (renewals).
  let restaurantId = Number(tx.metadata?.restaurant_id ?? 0) || null;
  const customerCode = tx.customer?.customer_code as string | undefined;
  if (!restaurantId && customerCode) {
    const { data } = await admin.from("subscriptions").select("restaurant_id").eq("paystack_customer_code", customerCode).maybeSingle();
    restaurantId = data ? Number(data.restaurant_id) : null;
  }
  if (!restaurantId) return { ok: false, reason: "restaurant not found" };

  // 2. Resolve plan and verify the amount really matches it (never trust metadata for money).
  const planCode = tx.plan?.plan_code ?? tx.plan_object?.plan_code;
  let planQuery = admin.from("plans").select("tier, price_ngn");
  planQuery = tx.metadata?.tier ? planQuery.eq("tier", tx.metadata.tier) : planQuery.eq("paystack_plan_code", planCode ?? "__none__");
  const { data: plan } = await planQuery.maybeSingle();
  if (!plan) return { ok: false, reason: "plan not found" };
  if (Number(tx.amount) !== Number(plan.price_ngn) * 100 || String(tx.currency ?? "NGN") !== "NGN") {
    console.error("Amount mismatch", { reference, got: tx.amount, expected: plan.price_ngn * 100 });
    return { ok: false, reason: "amount mismatch" };
  }

  // 3. Idempotency.
  const { error: dup } = await admin.from("billing_events").insert({
    event_key: `charge:${reference}`, event_type: "charge.success", restaurant_id: restaurantId, payload: tx,
  });
  if (dup) return { ok: true, duplicate: true, restaurantId };

  // 4. Extend the period from the later of now / current end.
  const { data: sub } = await admin.from("subscriptions").select("current_period_end").eq("restaurant_id", restaurantId).maybeSingle();
  const base = sub?.current_period_end && new Date(sub.current_period_end) > new Date() ? new Date(sub.current_period_end) : new Date();
  const periodEnd = addMonth(base).toISOString();

  await admin.from("subscriptions").upsert({
    restaurant_id: restaurantId, tier: plan.tier, status: "active",
    paystack_customer_code: customerCode ?? null, last_reference: reference,
    current_period_end: periodEnd, updated_at: new Date().toISOString(),
  }, { onConflict: "restaurant_id" });

  // 5. Switch the restaurant on (unless a platform admin suspended it) and set its tier.
  const { data: r } = await admin.from("restaurants").select("admin_suspended").eq("id", restaurantId).single();
  await admin.from("restaurants").update({ tier: plan.tier, is_active: !r?.admin_suspended }).eq("id", restaurantId);
  return { ok: true, restaurantId, tier: plan.tier, periodEnd };
}
