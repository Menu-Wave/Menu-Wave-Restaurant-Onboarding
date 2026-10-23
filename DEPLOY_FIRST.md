# Menu-Wave Fourth Site — deploy first

The live Supabase project is already prepared for onboarding and the three active plans are configured:
- Starter — ₦8,500/month
- Growth — ₦17,000/month
- Pro — ₦35,000/month
- New restaurants receive a 14-day trial.

## GitHub/Vercel
Create a new GitHub repo for this `Menu-Wave-Onboarding` folder and import that repo into Vercel.

Set these Vercel environment variables:
- `VITE_SUPABASE_URL=https://wxlhhisfexcltjpvcljo.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<your Supabase publishable key>`
- `VITE_CUSTOMER_URL=<customer site URL>`
- `VITE_STAFF_URL=<restaurant admin/cashier site URL>`

Build command: `npm run build`

Do NOT run migrations 001–005 from Claude against production. They were written for a different billing schema. `006_live_onboarding_trial.sql` documents the live integration applied to Supabase.

Paystack billing Edge Functions in this package are intentionally not enabled yet: they still need to be adapted to `subscription_plans` and the existing payment/webhook tables before paid renewal is turned on. The fourth site can run registration, menu setup, plan selection and the 14-day trial without that payment step.
