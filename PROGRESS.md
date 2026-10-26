## Current Development Stage
**Stage**: Stripe Subscription Billing (test mode)  
**Date**: 2026-10-25  
**Status**: Organization linked to Stripe customer/subscription. 14-day no-card trial, $149 CAD monthly company plan, Customer Portal, webhook with signature verification and idempotency. Access policy preserves existing organization approval and adds billing checks (trial, active, 7-day grace, paid-through after cancel). Data is never deleted.

## Schema Changes
Added to Organization: stripeCustomerId, stripeSubscriptionId, subscriptionStatus, trialStart, trialEnd, currentPeriodEnd, cancelAtPeriodEnd, canceledAt, paymentFailedAt, graceUntil.  
New model: StripeEvent (eventId unique for idempotency).

## Required Commands
```
npx prisma db push
npm install stripe
```

## Environment Variables (Vercel + .env)
- STRIPE_SECRET_KEY
- STRIPE_PRICE_ID (the $149 CAD monthly price)
- STRIPE_WEBHOOK_SECRET
- NEXTAUTH_URL

## Stripe Setup (test mode)
1. Create Product “EquipmentAI” and a recurring price of $149 CAD / month.
2. Copy the price ID into STRIPE_PRICE_ID.
3. Create a webhook endpoint pointing to `https://your-domain/api/billing/webhook` listening for `customer.subscription.*` events.
4. Copy the webhook signing secret into STRIPE_WEBHOOK_SECRET.

## Access Policy
- Organization must still be Approved (existing rules).
- trialing (before trialEnd) → full access
- active → full access
- past_due within graceUntil (7 days) → access + warning
- past_due after grace → restricted (billing page still available)
- canceled with currentPeriodEnd in the future → access until then
- trial ended with no payment method → restricted
- Data is never deleted on cancel or failure.

## Files
- prisma/schema.prisma
- src/lib/billing.ts
- src/app/api/billing/checkout/route.ts
- src/app/api/billing/portal/route.ts
- src/app/api/billing/webhook/route.ts
- src/app/api/billing/status/route.ts
- src/app/(app)/billing/page.tsx
- src/components/sidebar.tsx
- package.json
- PROGRESS.md

## Limitations
- Trial is started via Checkout (Stripe creates the trial). No automatic trial on organization approval yet.
- GST on the subscription is not automatically configured; configure Stripe Tax separately if required.
- Full server-side enforcement of billingAccess on every operational endpoint is not yet wired into every route (billing helpers and status endpoint exist; integrate into existing access-guard as a follow-up if needed).
- Tests were not executed in this environment.
