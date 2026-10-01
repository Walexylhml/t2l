# Setup Guide

This guide explains how to configure the services the checkout flow needs:
Supabase (database), Stripe (payments), and Resend (email). Nothing here
requires you to paste secrets into code or share them with anyone. All values
live in a local file called `.env.local` (and in your hosting provider's
environment variables for production).

## 1. Create your env file

Copy `.env.example` to `.env.local` at the project root:

    cp .env.example .env.local

    `.env.local` is gitignored and must never be committed. Fill in the values
    described below as you create each account.

    ## 2. Supabase (database + auth)

    1. Go to https://supabase.com and open (or create) your project.
    2. In the dashboard, open Project Settings -> API.
    3. Copy these into `.env.local`:
       - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
          - Project API keys -> anon public -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
             - Project API keys -> service_role (secret) -> `SUPABASE_SERVICE_ROLE_KEY`
             4. Open the SQL Editor, paste the contents of `supabase/schema.sql`, and run it.
                This creates the `orders` and `order_items` tables plus the verified-email
                   order-claim trigger.

                   The service_role key bypasses row-level security and is only ever used in
                   server code (API routes). Never expose it to the browser.

                   ## 3. Stripe (payments)

                   1. Go to https://dashboard.stripe.com and switch to Test mode while developing.
                   2. Open Developers -> API keys and copy:
                      - Publishable key -> `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
                         - Secret key -> `STRIPE_SECRET_KEY`
                         3. Set up the webhook (needed to mark orders as paid):
                            - Open Developers -> Webhooks -> Add endpoint.
                               - Endpoint URL: `https://YOUR_DOMAIN/api/stripe/webhook`
                                    (for local testing use the Stripe CLI: `stripe listen --forward-to
                                         localhost:3000/api/stripe/webhook`).
                                            - Select event: `checkout.session.completed`.
                                               - After creating it, copy the Signing secret (starts with `whsec_`) into
                                                    `STRIPE_WEBHOOK_SECRET`.

                                                    ## 4. Resend (order confirmation email)

                                                    Email is optional. If `RESEND_API_KEY` is blank, the app simply skips sending
                                                    and logs a note. To enable it:

                                                    1. Go to https://resend.com -> API Keys -> Create API Key.
                                                    2. Copy the key into `RESEND_API_KEY`.
                                                    3. Set `ORDER_FROM_EMAIL` to a verified sender, e.g.
                                                       `Thoughts2Lyfe <orders@yourdomain.com>`.

                                                       ## 5. Base URL

                                                       Set `NEXT_PUBLIC_BASE_URL` to where the app runs:
                                                       - Local: `http://localhost:3000`
                                                       - Production: `https://thoughts2lyfe.vercel.app`

                                                       Stripe uses this to build the success and cancel redirect URLs.

                                                       ## 6. Production (Vercel)

                                                       Add every variable from `.env.local` to the Vercel project under
                                                       Settings -> Environment Variables, then redeploy. Use live Stripe keys and a
                                                       production webhook endpoint when you go live.

                                                       ## Summary of where each key goes

                                                       | Variable | Where to get it | Secret? |
                                                       | --- | --- | --- |
                                                       | NEXT_PUBLIC_BASE_URL | You set it | No |
                                                       | NEXT_PUBLIC_SUPABASE_URL | Supabase -> Settings -> API | No |
                                                       | NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase -> Settings -> API | No |
                                                       | SUPABASE_SERVICE_ROLE_KEY | Supabase -> Settings -> API | Yes |
                                                       | NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe -> API keys | No |
                                                       | STRIPE_SECRET_KEY | Stripe -> API keys | Yes |
                                                       | STRIPE_WEBHOOK_SECRET | Stripe -> Webhooks | Yes |
                                                       | RESEND_API_KEY | Resend -> API Keys | Yes |
                                                       | ORDER_FROM_EMAIL | You set it | No |
                                                       
