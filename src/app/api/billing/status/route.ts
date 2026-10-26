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
  return NextResponse.json(org || {});
}
