# Merchant Support — Next.js PWA + Supabase on Vercel

This project uses **Next.js (App Router + PWA)** hosted on **Vercel** with **Supabase Postgres** as the backend database, including **pre-populated default merchants** and **default issue templates/scores**.

---

## 1. Create Tables & Pre-Populate Default Merchants in Supabase

1. Open your project in the **Supabase Dashboard** → **SQL Editor**.
2. Paste and run `supabase/migrations/001_init_and_seed.sql`.
3. To add or customize your default merchants, edit the `INSERT INTO public.merchants` block in `supabase/migrations/001_init_and_seed.sql` (or `DEFAULT_MERCHANTS` in `frontend/src/lib/seed.ts`). Each merchant automatically computes `right_8_digits` from `tid_mid`.

---

## 2. Deploy to Vercel

1. Import the `frontend` folder as a **Vercel** project.
2. Add these **Environment Variables** in Vercel Project Settings:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy. Open the live `*.vercel.app` URL on Android (Chrome) or iPhone/iPad (Safari → Share → **Add to Home Screen**) to install the PWA.
# ms_log
