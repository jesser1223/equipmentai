import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const to = body.to;
  if (!to) return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });

  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: orgId },
    include: { customer: true, lines: true, organization: true, payments: true, job: true },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Email is not configured. Add RESEND_API_KEY to environment variables." }, { status: 400 });
  }

  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const balance = Math.max(0, invoice.total - paid);

  const linesHtml = invoice.lines
    .map(
      (l) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${l.description}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${l.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${l.unit}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">$${l.rate.toFixed(2)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${l.amount.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;color:#111;background:#f7f7f7;margin:0;padding:24px">
  <div style="max-width:640px;margin:0 auto;background:#fff;padding:32px;border-radius:8px">
    <div style="display:flex;justify-content:space-between;margin-bottom:32px">
      <div>
        <div style="font-size:20px;font-weight:700">${invoice.organization.name}</div>
        ${invoice.organization.phone ? `<div style="font-size:13px;color:#555">${invoice.organization.phone}</div>` : ""}
      </div>
      <div style="text-align:right">
        <div style="font-size:24px;font-weight:700;color:#0d9488">INVOICE</div>
        <div style="font-size:13px">${invoice.number}</div>
        <div style="font-size:13px">Issued: ${new Date(invoice.issueDate).toLocaleDateString()}</div>
        ${invoice.dueDate ? `<div style="font-size:13px">Due: ${new Date(invoice.dueDate).toLocaleDateString()}</div>` : ""}
      </div>
    </div>

    <div style="margin-bottom:24px">
      <div style="font-weight:600;font-size:13px;color:#555">Bill To</div>
      <div>${invoice.customer.name}</div>
      ${invoice.customer.company ? `<div>${invoice.customer.company}</div>` : ""}
      ${invoice.customer.address ? `<div>${invoice.customer.address}</div>` : ""}
      ${invoice.job ? `<div style="margin-top:8px;font-size:13px">Job: ${invoice.job.title}${invoice.job.location ? " — " + invoice.job.location : ""}</div>` : ""}
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#f5f5f5">
          <th style="padding:8px;text-align:left">Description</th>
          <th style="padding:8px;text-align:left">Qty</th>
          <th style="padding:8px;text-align:left">Unit</th>
          <th style="padding:8px;text-align:left">Rate</th>
          <th style="padding:8px;text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>${linesHtml}</tbody>
    </table>

    <div style="margin-top:16px;text-align:right;font-size:14px">
      <div>Subtotal: $${invoice.subtotal.toFixed(2)}</div>
      <div>GST (${((invoice.taxRate || 0) * 100).toFixed(0)}%): $${invoice.taxAmount.toFixed(2)}</div>
      <div style="font-size:18px;font-weight:700;margin-top:4px">Total: $${invoice.total.toFixed(2)}</div>
      <div>Paid: $${paid.toFixed(2)}</div>
      <div style="font-weight:600">Balance: $${balance.toFixed(2)}</div>
    </div>

    ${invoice.notes ? `<div style="margin-top:24px;font-size:12px;color:#555">${invoice.notes}</div>` : ""}
  </div>
</body>
</html>`;

  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || "invoices@equipmentai.app",
      to,
      subject: `Invoice ${invoice.number} from ${invoice.organization.name}`,
      html,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Failed to send email" }, { status: 500 });
  }
}
