import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { validateQuoteConversion } from "@/lib/quotes";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    const job = await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.findFirst({
        where: { id, organizationId: orgId },
        include: { job: true, lines: true, customer: true },
      });
      if (!quote) throw new Error("NOT_FOUND");
      if (quote.customer.archivedAt) throw new Error("Customer is archived and cannot be used for new work.");

      const check = validateQuoteConversion(quote, body);
      if (typeof check === "string") throw new Error(check);

      if (check.equipmentId) {
        const equipment = await tx.equipment.findFirst({
          where: { id: check.equipmentId, organizationId: orgId },
        });
        if (!equipment) throw new Error("Equipment not found.");
      }

      const existing = await tx.job.findUnique({ where: { quoteId: id } });
      if (existing) throw new Error("This quote has already been converted to a job.");

      return tx.job.create({
        data: {
          title: quote.jobName,
          organizationId: orgId,
          customerId: quote.customerId,
          quoteId: quote.id,
          equipmentId: check.equipmentId,
          startDate: new Date(check.startDate),
          endDate: check.endDate ? new Date(check.endDate) : null,
          location: check.location,
          notes: body.notes ?? quote.notes,
          status: "Scheduled",
        },
        include: { customer: true, equipment: true, quote: true },
      });
    });

    return NextResponse.json(job, { status: 201 });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (err.code === "P2002") {
      return NextResponse.json({ error: "This quote has already been converted to a job." }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || "Could not convert quote." }, { status: 400 });
  }
}
