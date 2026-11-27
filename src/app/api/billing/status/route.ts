import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { daysRemaining as remainingDays, extendedTrialEnd } from "@/lib/trial";

export async function GET() {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      subscriptionStatus: true,
      trialStart: true,
      trialEnd: true,
      stripeSubscriptionId: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      graceUntil: true,
      stripeCustomerId: true,
    },
  });

  if (!org) return NextResponse.json({});

  const extended = extendedTrialEnd(org);
  if (extended) {
    await prisma.organization.update({ where: { id: orgId }, data: { trialEnd: extended } });
    org = { ...org, trialEnd: extended };
  }

  const now = new Date();
  let daysLeft: number | null = null;
  let periodLabel = "";

  if (org.subscriptionStatus === "trialing" && org.trialEnd) {
    daysLeft = remainingDays(org.trialEnd, now);
    periodLabel = "trial";
  } else if (org.currentPeriodEnd) {
    const end = new Date(org.currentPeriodEnd);
    daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    periodLabel = org.cancelAtPeriodEnd ? "until cancellation" : "in current period";
  }

  return NextResponse.json({
    ...org,
    daysRemaining: daysLeft,
    periodLabel,
  });
}
