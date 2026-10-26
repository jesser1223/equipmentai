import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      subscriptionStatus: true,
      trialEnd: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      graceUntil: true,
      stripeCustomerId: true,
    },
  });

  if (!org) return NextResponse.json({});

  const now = new Date();
  let daysRemaining: number | null = null;
  let periodLabel = "";

  if (org.subscriptionStatus === "trialing" && org.trialEnd) {
    const end = new Date(org.trialEnd);
    daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    periodLabel = "trial";
  } else if (org.currentPeriodEnd) {
    const end = new Date(org.currentPeriodEnd);
    daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    periodLabel = org.cancelAtPeriodEnd ? "until cancellation" : "in current period";
  }

  return NextResponse.json({
    ...org,
    daysRemaining,
    periodLabel,
  });
}
