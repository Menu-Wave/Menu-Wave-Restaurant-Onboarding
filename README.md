# Menu-Wave Onboarding (4th site)

Restaurants register, build their menu, subscribe via Paystack, and get their QR codes.

Flow: `/register` → `/onboarding` (restaurant → menu → plan → go live) → `/billing/callback` → `/dashboard`.

## Setup
1. Create the repo, copy these files in, `bun install`, `bun dev`.
   (`src/routeTree.gen.ts` is generated automatically the first time you run `bun dev` or `bun run build`.)
2. Env vars (Vercel → Settings → Environment Variables): see `.env.example`. `VITE_CUSTOMER_URL` and `VITE_STAFF_URL` are the deployed URLs of your other two apps.
3. Supabase → Authentication → URL Configuration: add this site's URL to *Redirect URLs*.
4. Run the SQL in `supabase/migrations` in order (see the top-level README).
5. Edge Function secrets:
   `supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxx ONBOARDING_URL=https://your-onboarding-site ALLOWED_ORIGINS=https://your-onboarding-site`
6. Deploy functions:
   `supabase functions deploy billing-init billing-verify billing-portal`
   `supabase functions deploy paystack-webhook --no-verify-jwt`
7. Paystack dashboard: create 3 monthly plans, put each `PLN_xxx` code into `public.plans.paystack_plan_code`, and set the webhook URL to
   `https://<project-ref>.supabase.co/functions/v1/paystack-webhook`.
