import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { buildInvoicePdf } from "@/lib/invoice-pdf";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: orgId },
    include: { customer: true, lines: true, organization: true, payments: true },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status !== "Draft") {
    return NextResponse.json({ error: "Only draft invoices can be issued." }, { status: 400 });
  }

  const issued = await prisma.invoice.update({
    where: { id },
    data: { status: "Issued", issueDate: new Date() },
    include: { customer: true, lines: true, organization: true, payments: true },
  });

  const org = issued.organization;
  const emailResult: { sent: boolean; skipped?: string; failed?: string } = { sent: false };

  if (!org.autoSendInvoices) {
    return NextResponse.json({ invoice: issued, email: { sent: false, skipped: "Auto-send is off" } });
  }

  const to = issued.customer?.email?.trim();
  if (!to) {
    return NextResponse.json({ invoice: issued, email: { sent: false, skipped: "Customer has no email address" } });
  }

  const existing = await prisma.invoiceEmail.findFirst({
    where: { invoiceId: id, status: "Sent" },
  });
  if (existing) {
    return NextResponse.json({ invoice: issued, email: { sent: false, skipped: "Already sent" } });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM?.trim();
  if (!apiKey || !fromAddress) {
    return NextResponse.json({
      invoice: issued,
      email: { sent: false, skipped: "Email is not configured. Set RESEND_API_KEY and RESEND_FROM in Vercel, then redeploy." },
    });
  }
  if (fromAddress.endsWith("@resend.dev")) {
    return NextResponse.json({
      invoice: issued,
      email: { sent: false, skipped: "RESEND_FROM is still a Resend testing address. Set it to an address on your verified domain." },
    });
  }

  const record = await prisma.invoiceEmail.create({
    data: {
      organizationId: orgId,
      invoiceId: id,
      to,
      subject: `Invoice ${issued.number} from ${org.name}`,
      status: "Queued",
      type: "INVOICE",
      userId: (session?.user as any)?.id,
    },
  });

  try {
    const resend = new Resend(apiKey);
    const pdf = await buildInvoicePdf(issued);
    const result = await resend.emails.send({
      from: `${org.name} <${fromAddress}>`,
      to,
      replyTo: org.replyToEmail || org.email || undefined,
      subject: record.subject,
      html: `<p>Invoice ${issued.number} from ${org.name}. Total: $${issued.total.toFixed(2)}</p>`,
      attachments: [{ filename: `${issued.number}.pdf`, content: Buffer.from(pdf) }],
    });
    if (result.error) {
      await prisma.invoiceEmail.update({ where: { id: record.id }, data: { status: "Failed", error: result.error.message } });
      return NextResponse.json({ invoice: issued, email: { sent: false, failed: "Email failed. You can retry from the invoice." } });
    }
    await prisma.invoiceEmail.update({ where: { id: record.id }, data: { status: "Sent", providerId: result.data?.id } });
    return NextResponse.json({ invoice: issued, email: { sent: true } });
  } catch (err: any) {
    await prisma.invoiceEmail.update({ where: { id: record.id }, data: { status: "Failed", error: err.message || "Send failed" } });
    return NextResponse.json({ invoice: issued, email: { sent: false, failed: "Email failed. You can retry from the invoice." } });
  }
}
