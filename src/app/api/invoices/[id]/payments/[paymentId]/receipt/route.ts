import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { buildReceiptPdf } from "@/lib/receipt-pdf";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br/>");
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, paymentId } = await params;
  const body = await req.json().catch(() => ({}));
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: orgId },
    include: { customer: true, organization: true, payments: true },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payment = invoice.payments.find((p) => p.id === paymentId);
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  const to = (body.to || invoice.customer?.email || "").trim();
  if (!to || !to.includes("@")) {
    return NextResponse.json({ error: "Customer email is required" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM?.trim();
  if (!apiKey || !fromAddress || fromAddress.endsWith("@resend.dev")) {
    return NextResponse.json({ error: "Email is not configured" }, { status: 400 });
  }

  const through = invoice.payments
    .filter((p) => p.createdAt <= payment.createdAt)
    .reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, invoice.total - through);
  const subject = `Payment receipt for invoice ${invoice.number}`;

  const record = await prisma.invoiceEmail.create({
    data: {
      organizationId: orgId,
      invoiceId: invoice.id,
      paymentId: payment.id,
      to,
      subject,
      status: "Queued",
      type: "RECEIPT",
      userId: (session?.user as any)?.id,
    },
  });

  const html = `<p>We received a payment of <strong>$${payment.amount.toFixed(2)}</strong> for invoice <strong>${escapeHtml(invoice.number)}</strong>.</p>
<p>Payment date: ${escapeHtml(new Date(payment.paidAt).toLocaleDateString())}<br/>
Remaining balance after this payment: $${remaining.toFixed(2)}</p>
<p>A receipt is attached.</p>`;

  try {
    const resend = new Resend(apiKey);
    const pdf = await buildReceiptPdf({
      organization: invoice.organization,
      customer: invoice.customer,
      invoice,
      payment,
      amountPaid: through,
      remaining,
    });
    const result = await resend.emails.send({
      from: `${invoice.organization.name} <${fromAddress}>`,
      to,
      replyTo: invoice.organization.replyToEmail || invoice.organization.email || undefined,
      subject,
      html,
      attachments: [{ filename: `receipt-${invoice.number}.pdf`, content: Buffer.from(pdf) }],
    });
    if (result.error) {
      await prisma.invoiceEmail.update({
        where: { id: record.id },
        data: { status: "Failed", error: result.error.message },
      });
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    await prisma.invoiceEmail.update({
      where: { id: record.id },
      data: { status: "Sent", providerId: result.data?.id },
    });
    return NextResponse.json({ ok: true, status: "Sent" });
  } catch (err: any) {
    await prisma.invoiceEmail.update({
      where: { id: record.id },
      data: { status: "Uncertain", error: err.message || "Send outcome unknown" },
    });
    return NextResponse.json({ error: "Email outcome is uncertain. The payment was not changed." }, { status: 500 });
  }
}
