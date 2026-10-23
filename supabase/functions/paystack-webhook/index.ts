// Paystack → us. Source of truth for renewals, failures and cancellations.
// Deploy: supabase functions deploy paystack-webhook --no-verify-jwt
// Then set the webhook URL in Paystack Dashboard → Settings → API Keys & Webhooks to:
//   https://<project-ref>.supabase.co/functions/v1/paystack-webhook
import { adminClient, applySuccessfulCharge } from "../_shared/common.ts";

async function validSignature(raw: string, signature: string | null) {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(Deno.env.get("PAYSTACK_SECRET_KEY")!),
    { name: "HMAC", hash: "SHA-512" }, false, ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)));
  const hex = Array.from(mac).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const raw = await req.text();
  if (!(await validSignature(raw, req.headers.get("x-paystack-signature")))) return new Response("Bad signature", { status: 401 });

  const event = JSON.parse(raw);
  const data = event.data ?? {};
  const admin = adminClient();

  try {
    const customerCode = data.customer?.customer_code as string | undefined;
    const bySubOrCustomer = async () => {
      if (!customerCode) return null;
      const { data: s } = await admin.from("subscriptions").select("restaurant_id").eq("paystack_customer_code", customerCode).maybeSingle();
      return s ? Number(s.restaurant_id) : null;
    };

    switch (event.event) {
      case "charge.success":
        await applySuccessfulCharge(admin, data);
        break;

      case "subscription.create": {
        // Arrives right after the first charge; keep the codes needed for the manage-link.
        const rid = (await bySubOrCustomer()) ?? (Number(data.metadata?.restaurant_id ?? 0) || null);
        // charge.success may not have been processed yet; fail so Paystack retries this event later.
        if (!rid) throw new Error("subscription.create: restaurant not resolved yet");
        {
          await admin.from("subscriptions").update({
            paystack_customer_code: customerCode ?? null,
            paystack_subscription_code: data.subscription_code ?? null,
            paystack_email_token: data.email_token ?? null,
            updated_at: new Date().toISOString(),
          }).eq("restaurant_id", rid);
        }
        break;
      }

      case "subscription.disable":
      case "subscription.not_renew": {
        const rid = await bySubOrCustomer();
        if (rid) await admin.from("subscriptions").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("restaurant_id", rid);
        break; // stays live until current_period_end (+grace) via mw_expire_subscriptions()
      }

      case "invoice.payment_failed": {
        const rid = await bySubOrCustomer();
        if (rid) await admin.from("subscriptions").update({ status: "past_due", updated_at: new Date().toISOString() }).eq("restaurant_id", rid);
        break;
      }
    }
  } catch (err) {
    console.error("Webhook processing failed", event?.event, err);
    return new Response("Error", { status: 500 }); // Paystack will retry
  }
  return new Response("ok", { status: 200 });
});
