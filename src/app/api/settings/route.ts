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

  let overdueReminderDays: number | undefined;
  if (body.overdueReminderDays != null) {
    const n = Number(body.overdueReminderDays);
    if (!Number.isInteger(n) || n < 1 || n > 90) {
      return NextResponse.json({ error: "Overdue reminder days must be a whole number from 1 to 90." }, { status: 400 });
    }
    overdueReminderDays = n;
  }

  let quoteFollowUpDays: number | undefined;
  if (body.quoteFollowUpDays != null) {
    const n = Number(body.quoteFollowUpDays);
    if (!Number.isInteger(n) || n < 1 || n > 90) {
      return NextResponse.json({ error: "Quote follow-up days must be a whole number from 1 to 90." }, { status: 400 });
    }
    quoteFollowUpDays = n;
  }

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
      autoSendInvoices: body.autoSendInvoices != null ? Boolean(body.autoSendInvoices) : undefined,
      overdueReminderDays,
      quoteFollowUpDays,
    },
  });
  return NextResponse.json(updated);
}
