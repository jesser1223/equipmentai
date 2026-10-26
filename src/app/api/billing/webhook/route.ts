import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  // Idempotency
  const existing = await prisma.stripeEvent.findUnique({ where: { eventId: event.id } });
  if (existing) return NextResponse.json({ received: true, duplicate: true });

  try {
    if (event.type.startsWith("customer.subscription.")) {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.organizationId;
      if (orgId) {
        const grace = sub.status === "past_due" ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            stripeSubscriptionId: sub.id,
            subscriptionStatus: sub.status,
            trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
            trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
            currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
            cancelAtPeriodEnd: sub.cancel_at_period_end || false,
            canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
            paymentFailedAt: sub.status === "past_due" ? new Date() : null,
            graceUntil: grace,
          },
        });
      }
    }

    await prisma.stripeEvent.create({
      data: { eventId: event.id, type: event.type, organizationId: (event.data.object as any)?.metadata?.organizationId || null },
    });
  } catch (err) {
    console.error("[stripe webhook]", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
