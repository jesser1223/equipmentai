import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICE_ID } from "@/lib/billing";

export async function POST() {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

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

  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    subscription_data: {
      trial_period_days: org.trialEnd ? undefined : 14,
      metadata: { organizationId: org.id },
    },
    success_url: `${process.env.NEXTAUTH_URL}/billing?success=1`,
    cancel_url: `${process.env.NEXTAUTH_URL}/billing?canceled=1`,
    metadata: { organizationId: org.id },
  });

  return NextResponse.json({ url: checkout.url });
}
