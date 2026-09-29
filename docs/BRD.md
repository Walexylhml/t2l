# Business Requirements Document (BRD)
## Thoughts2Lyfe - Custom Apparel Web Application

Status: Draft (pre-development). Last updated: 2026-09-09.
Purpose: Single source of truth for the project. Any contributor (human or AI) should read this first to understand full scope, decisions made, and execution plan.

## 1. Overview and Vision

Thoughts2Lyfe is an established custom-apparel and accessories brand (currently on Instagram, @thoughts2lyfe) known for bold streetwear graphics and event-driven activations - most recently as merch/accessories partner for the United Grid League, printing custom boutique wears live for players and audiences.

The vision: move the brand off Instagram-only selling onto a self-owned web app that does two things well - sell curated ready-made pieces, and let customers design their own piece with a live preview and camera try-on before buying. Guiding principle: minimize recurring cost, using free tiers wherever possible, with cost incurred only per-sale or for the domain.

## 2. Goals and Success Metrics

Give the brand an owned storefront independent of social platforms, convert existing audience and event traffic into direct online sales, and differentiate through a self-serve design experience. MVP is successful once a real customer can complete an end-to-end purchase (store item or custom design) and the brand receives the order with delivery details.

## 3. Target Users

Existing Instagram followers and fans; event and activation attendees who want same-theme or personalized pieces; event/team organizers wanting bulk or collaboration orders. Secondary internal user: the brand owner, who manages products, designs, orders, and feedback.

## 4. Scope

In scope: a two-section customer-facing web app - a Store of curated printed designs and a Design Studio for build-your-own; cart, checkout, and delivery-address capture; live payment collection; an Events section (attended and upcoming); a customer feedback form; the data/infrastructure to support orders and customers; and an owner-managed design library (upload/edit/delete).

Out of scope for now: a full drag-and-drop design engine on par with Custom Ink/Spreadshirt (we use a curated preset-design overlay approach instead); a native mobile app; a bulk/wholesale quoting portal (later phase, captured only as a lead form initially); inventory/warehouse management beyond basic stock flags.

## 5. Functional Requirements

a user should be able to use the site as a guest user, or register/sign up or login to an existing account. so the user can see their profile, transaction history, provide feedack

Store section: curated grid of ready-made designs with imagery, name, and price. Each product allows size and quantity selection and add-to-cart. Catalog-driven so new drops are easy to add.

Design Studio: customer picks a plain garment and color, then selects a design from the owner-managed library. The chosen design renders onto a garment mockup for a realistic as-printed preview that updates live. Customer can optionally activate the device camera for a try-on and capture the look, then select size and quantity and add the custom piece to the same cart as store items.

Owner-managed design library: through an authenticated admin area, the owner can upload new artwork, edit design details (name, price modifier, active/inactive), and delete designs. Artwork is stored in Supabase Storage; metadata in a Supabase table. The customer-facing Design Studio reads from this library so new drops appear without code changes.

Cart and checkout: unified cart holds store and custom items, supports quantity/size edits and removal, and shows a running total. Checkout captures delivery address and contact details and hands off to the payment processor. On success an order record is created and the customer receives confirmation.

Events section: showcases attended events (e.g. United Grid League) and upcoming events, as social proof and a collaboration channel.

Feedback: a form for customers to leave a rating and written feedback, stored for the owner to review.

Admin/owner needs: view incoming orders with delivery details, manage product catalog and design library, and read feedback. Early on this can run through the Supabase dashboard before a dedicated admin UI is built.

## 6. Non-Functional Requirements

Fast and mobile-first (audience is Instagram-native and mobile-heavy), visually polished and on-brand (glossy, bold, streetwear aesthetic), accessible, and secure - secrets kept out of the repo, payment/PII handled only by trusted processors. Cheap to run (free tiers), and simple for the owner to maintain.

## 7. Technical Architecture and Stack (decided)

Framework: Next.js (React) + Tailwind CSS.
Hosting: Vercel, auto-deploy on merge to main. Server logic via Vercel serverless / Next.js API routes (no dedicated server).
Database/Auth/Storage: Supabase (Postgres) - bundles DB, auth, and file storage in one free tier.
Images: repo assets and/or Supabase Storage initially; Cloudinary optional later for optimization.
Camera try-on: processed client-side; images not uploaded (privacy + cost).
Payments: Stripe (US-based brand), via Stripe Checkout. Per-transaction fees only, no monthly fee.
Notifications: Resend or similar free tier. CDN/security: Cloudflare optional, free.

Domain portability: no absolute URLs hardcoded; the public base URL is read from NEXT_PUBLIC_BASE_URL, so moving from the free vercel.app address to a custom domain is a configuration-only change (add domain + update DNS in Vercel) with no code changes.

## 8. Accounts, Credentials, and Responsibility Split

Performed by the owner only (cannot be delegated to the AI contributor): creating the GitHub repo; creating Vercel, Supabase, and Stripe accounts; purchasing/configuring the custom domain; entering all secret keys, banking, and KYC/identity info; setting up admin login credentials.

AI contributor role: write application and integration code, open pull requests for review, and set up .env.example placeholders plus docs for where keys go. Never handles live credentials, payment details, account creation, or admin passwords. All secrets are stored as environment variables in Vercel/Supabase and never committed to the repo.

## 9. Cost Summary

Recurring cost is effectively zero at launch: GitHub, Vercel hosting, Supabase DB/auth/storage, email, and analytics on free tiers. Stripe costs are per-sale only (approx 2.9 percent + 0.30 USD per transaction, US). Only upfront/annual cost is the custom domain (approx 10-15 USD/year), optional at launch since the free vercel.app URL can be used first.

## 10. Workflow

Owner owns the GitHub repo with main protected so nothing merges without explicit approval. AI contributor opens focused pull requests; owner reviews, requests changes if needed, and merges. Each merge auto-deploys to Vercel so progress is visible on a live URL. Work proceeds in small, reviewable increments.

## 11. Phased Roadmap

Phase 0 - Foundation: repo scaffold (Next.js + Tailwind), base layout, branding, docs (this BRD). Deploys to a live Vercel URL.
Phase 1 - Store: catalog-driven store grid, product detail with size/quantity, working client-side cart.
Phase 2 - Design Studio: garment + color picker, curated design overlay with live mockup preview, camera try-on, add-to-cart of custom pieces, and the Supabase-backed owner-managed design library (DB, storage, auth introduced here).
Phase 3 - Checkout and Payments: delivery-address capture, Stripe Checkout, order records in Supabase, confirmation flow. Owner supplies Stripe keys.
Phase 4 - Events and Feedback: events showcase and feedback form with storage.
Phase 5 - Polish and Growth: admin dashboard (orders, feedback, catalog + design management), email notifications, custom domain, analytics, SEO, remarketing hooks; bulk/wholesale enquiry form considered here.

## 12. Decisions Log

- US-based brand; payment processor = Stripe.
- Stack = Next.js + Tailwind on Vercel; Supabase for DB/auth/storage.
- Launch on the free Vercel URL first; add custom domain later (config-only change).
- Design library is owner-managed (upload/edit/delete) via an authenticated admin area.
- Free-first: no monthly fees where avoidable; only per-sale (Stripe) and domain (annual) costs.

## 13. Open Questions

Final domain name to register; shipping/delivery rate rules and regions served; whether a bulk/wholesale flow is needed in year one; exact admin auth approach (Supabase Auth email/password vs magic link).
