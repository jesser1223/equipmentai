import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { executeConfirmedAction } from "@/lib/ai-tools";
import { assistantEntitlementUpdate } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { isConfiguredOwner } from "@/lib/owner";

export async function POST(req: Request) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const userId = (session?.user as any)?.id;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  const entitlement = assistantEntitlementUpdate(org);
  if (Object.keys(entitlement.updates).length) {
    await prisma.organization.update({ where: { id: org.id }, data: entitlement.updates });
  }
  const ownerTesting = isConfiguredOwner(userId) && org.status === "Approved" && entitlement.access.reason !== "trial-ended";
  if (!entitlement.access.allowed && !ownerTesting) return NextResponse.json({ error: entitlement.access.message }, { status: 402 });
  const { actionId } = await req.json();
  if (!actionId) return NextResponse.json({ error: "Action is required." }, { status: 400 });
  const result = await executeConfirmedAction(actionId, orgId);
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}