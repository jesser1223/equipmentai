import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { executeConfirmedAction } from "@/lib/ai-tools";

export async function POST(req: Request) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { actionId } = await req.json();
  if (!actionId) return NextResponse.json({ error: "Action is required." }, { status: 400 });
  const result = await executeConfirmedAction(actionId, orgId);
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}
