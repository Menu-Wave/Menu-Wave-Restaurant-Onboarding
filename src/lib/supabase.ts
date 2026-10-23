import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://wxlhhisfexcltjpvcljo.supabase.co";
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? "sb_publishable_6bs0IPax7ctABcDJrcWW5w_3PHfgfvk";
export const CUSTOMER_URL = (import.meta.env.VITE_CUSTOMER_URL ?? "").replace(/\/$/, "");
export const STAFF_URL = (import.meta.env.VITE_STAFF_URL ?? "").replace(/\/$/, "");

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "menu-wave-onboarding-auth", // separate from staff/superadmin sessions
  },
});

export type Tier = "tier1" | "tier2" | "tier3";
export type SubStatus = "trialing" | "incomplete" | "active" | "past_due" | "expired" | "cancelled";

export interface Plan {
  id: string;
  code: "starter" | "growth" | "pro";
  name: string;
  description: string;
  monthly_price_kobo: number;
  features: Record<string, boolean>;
  limits: { menu_items?: number; tables?: number; ai_analyses_per_month?: number };
  display_order: number;
}
export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  currency: string;
  table_count: number;
  order_code_prefix: string;
  is_active: boolean;
  tier: Tier;
}
export interface Subscription {
  restaurant_id: number;
  plan_id: string;
  status: SubStatus;
  trial_end: string;
  current_period_end: string | null;
}
export interface Category {
  id: number;
  name: string;
  display_order: number;
}
export interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  emoji: string | null;
  image_url: string | null;
}

export const naira = (n: number) => `₦${Number(n).toLocaleString("en-NG")}`;
export const isLive = (s?: SubStatus | null) => s === "trialing" || s === "active";

// Calls one of our Edge Functions as the signed-in user.
export async function callFunction<T>(name: string, body?: unknown): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in again.");
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data as T;
}

// Loads everything the wizard/dashboard needs about the signed-in user's restaurant.
export async function loadAccount() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: staff } = await supabase.from("staff").select("restaurant_id, role").eq("id", user.id).maybeSingle();
  if (!staff) return { user, restaurant: null, subscription: null, itemCount: 0 };
  const [r, s, c] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, slug, currency, table_count, order_code_prefix, is_active, tier")
      .eq("id", staff.restaurant_id)
      .single(),
    supabase
      .from("subscriptions")
      .select("restaurant_id, plan_id, status, trial_end, current_period_end")
      .eq("restaurant_id", staff.restaurant_id)
      .maybeSingle(),
    supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("restaurant_id", staff.restaurant_id),
  ]);
  return {
    user,
    restaurant: (r.data as Restaurant) ?? null,
    subscription: (s.data as Subscription) ?? null,
    itemCount: c.count ?? 0,
  };
}
export type Account = NonNullable<Awaited<ReturnType<typeof loadAccount>>>;

export async function uploadMenuImage(restaurantId: number, file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use a JPG, PNG or WebP image.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Image must be under 2 MB.");
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${restaurantId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("menu-images").upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  return supabase.storage.from("menu-images").getPublicUrl(path).data.publicUrl;
}
