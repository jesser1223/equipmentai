import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { buildInvoicePdf } from "@/lib/invoice-pdf";

function buildHtml(invoice: any, paid: number, balance: number) {
  const lines = invoice.lines
    .map(
      (l: any) =>
        `<tr>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb">${l.description}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb">${l.quantity}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb">${l.unit}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb">$${l.rate.toFixed(2)}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right">$${l.amount.toFixed(2)}</td>
        </tr>`
    )
    .join("");
  const org = invoice.organization;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;background:#f4f4f5;margin:0;padding:24px;color:#111">
  <div style="max-width:680px;margin:0 auto;background:#fff;padding:40px;border-radius:12px">
    <div style="display:flex;justify-content:space-between;margin-bottom:28px">
      <div>
        ${org.logoUrl ? `<img src="${org.logoUrl}" alt="" style="height:48px;margin-bottom:8px"/>` : ""}
        <div style="font-size:22px;font-weight:700">${org.name}</div>
        ${org.address ? `<div style="font-size:13px;color:#555">${org.address}</div>` : ""}
        ${org.phone ? `<div style="font-size:13px;color:#555">${org.phone}</div>` : ""}
        ${org.email ? `<div style="font-size:13px;color:#555">${org.email}</div>` : ""}
        ${org.gstNumber ? `<div style="font-size:13px;color:#555">GST: ${org.gstNumber}</div>` : ""}
      </div>
      <div style="text-align:right">
        <div style="font-size:26px;font-weight:700;color:#0d9488">INVOICE</div>
        <div style="font-size:14px">${invoice.number}</div>
        <div style="font-size:13px">Issued ${new Date(invoice.issueDate).toLocaleDateString()}</div>
        ${invoice.dueDate ? `<div style="font-size:13px">Due ${new Date(invoice.dueDate).toLocaleDateString()}</div>` : ""}
      </div>
    </div>
    <div style="margin-bottom:20px">
      <div style="font-size:12px;font-weight:600;color:#666">Bill To</div>
      <div>${invoice.customer.name}</div>
      ${invoice.customer.company ? `<div>${invoice.customer.company}</div>` : ""}
      ${invoice.customer.address ? `<div>${invoice.customer.address}</div>` : ""}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:#f5f5f5">
        <th style="padding:10px;text-align:left">Description</th>
        <th style="padding:10px;text-align:left">Qty</th>
        <th style="padding:10px;text-align:left">Unit</th>
        <th style="padding:10px;text-align:left">Rate</th>
        <th style="padding:10px;text-align:right">Amount</th>
      </tr></thead>
      <tbody>${lines}</tbody>
    </table>
    <div style="margin-top:16px;text-align:right;font-size:14px">
      <div>Subtotal: $${invoice.subtotal.toFixed(2)}</div>
      <div>GST (${((invoice.taxRate || 0) * 100).toFixed(0)}%): $${invoice.taxAmount.toFixed(2)}</div>
      <div style="font-size:18px;font-weight:700;margin-top:4px">Total: $${invoice.total.toFixed(2)}</div>
      <div>Paid: $${paid.toFixed(2)}</div>
      <div style="font-weight:600">Balance due: $${balance.toFixed(2)}</div>
    </div>
    ${invoice.notes ? `<div style="margin-top:24px;font-size:12px;color:#555">${invoice.notes}</div>` : ""}
    ${org.invoiceFooter ? `<div style="margin-top:16px;font-size:12px;color:#555">${org.invoiceFooter}</div>` : ""}
  </div>
</body></html>`;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const to = body.to?.trim();
  const subject = body.subject?.trim();
  if (!to) return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });

  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: orgId },
    include: { customer: true, lines: true, organization: true, payments: true, job: true },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM?.trim();
  if (!apiKey || !fromAddress) {
    return NextResponse.json(
      {
        error:
          "Email is not configured. Set RESEND_API_KEY and RESEND_FROM (an address on your verified domain) in Vercel, then redeploy.",
      },
      { status: 400 }
    );
  }
  if (fromAddress.endsWith("@resend.dev")) {
    return NextResponse.json(
      {
        error:
          "RESEND_FROM is still a Resend testing address. Verify your domain at resend.com/domains and set RESEND_FROM to an address on that domain (for example invoices@yourdomain.com).",
      },
      { status: 400 }
    );
  }

  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const balance = Math.max(0, invoice.total - paid);
  const fromName = invoice.organization.name;
  const replyTo = invoice.organization.replyToEmail || invoice.organization.email || (session?.user as any)?.email;
  const finalSubject = subject || `Invoice ${invoice.number} from ${fromName}`;
  const html = buildHtml(invoice, paid, balance);
  const pdf = await buildInvoicePdf(invoice);

  const record = await prisma.invoiceEmail.create({
    data: {
      organizationId: orgId,
      invoiceId: invoice.id,
      to,
      subject: finalSubject,
      status: "Queued",
      type: "INVOICE",
      userId: (session?.user as any)?.id,
    },
  });

  const resend = new Resend(apiKey);
  try {
    const result = await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to,
      replyTo: replyTo || undefined,
      subject: finalSubject,
      html,
      attachments: [
        {
          filename: `${invoice.number}.pdf`,
          content: Buffer.from(pdf),
        },
      ],
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
    return NextResponse.json({ ok: true, status: "Sent", id: result.data?.id });
  } catch (e: any) {
    await prisma.invoiceEmail.update({
      where: { id: record.id },
      data: { status: "Failed", error: e.message },
    });
    return NextResponse.json({ error: e.message || "Failed to send" }, { status: 500 });
  }
}
