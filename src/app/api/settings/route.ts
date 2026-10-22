import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  return NextResponse.json(org);
}

export async function PATCH(req: Request) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: {
      name: body.name,
      address: body.address,
      phone: body.phone,
      email: body.email,
      currency: body.currency,
      taxRate: body.taxRate != null ? Number(body.taxRate) : undefined,
      invoicePrefix: body.invoicePrefix,
      defaultNotes: body.defaultNotes,
      paymentTerms: body.paymentTerms,
      gstNumber: body.gstNumber,
      logoUrl: body.logoUrl,
      invoiceFooter: body.invoiceFooter,
      replyToEmail: body.replyToEmail,
    },
  });
  return NextResponse.json(updated);
}
