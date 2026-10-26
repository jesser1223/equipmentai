import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICE_ID } from "@/lib/billing";

export async function POST() {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured (missing STRIPE_SECRET_KEY)." }, { status: 500 });
  }
  if (!STRIPE_PRICE_ID) {
    return NextResponse.json({ error: "Stripe price is not configured (missing STRIPE_PRICE_ID)." }, { status: 500 });
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  try {
    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { organizationId: org.id },
        name: org.name,
        email: org.email || undefined,
      });
      customerId = customer.id;
      await prisma.organization.update({ where: { id: org.id }, data: { stripeCustomerId: customerId } });
    }

    const base = (process.env.NEXTAUTH_URL || "https://equipmentai-ppov.vercel.app").replace(/\/$/, "");
    const successUrl = base.startsWith("http") ? `${base}/billing?success=1` : `https://${base}/billing?success=1`;
    const cancelUrl = base.startsWith("http") ? `${base}/billing?canceled=1` : `https://${base}/billing?canceled=1`;

    const checkout = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      subscription_data: {
        trial_period_days: org.trialEnd ? undefined : 14,
        metadata: { organizationId: org.id },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { organizationId: org.id },
      // Avoid Managed Payments tax-code requirement
      // @ts-ignore
      managed_payments: { enabled: false },
    });

    if (!checkout.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 500 });
    }

    return NextResponse.json({ url: checkout.url });
  } catch (err: any) {
    console.error("[billing/checkout]", err);
    return NextResponse.json({ error: err.message || "Stripe checkout failed" }, { status: 500 });
  }
}
