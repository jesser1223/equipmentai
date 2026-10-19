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
    include: { customer: true, lines: true, organization: true },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Email is not configured. Add RESEND_API_KEY to environment variables." }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const linesHtml = invoice.lines
    .map((l) => `<tr><td>${l.description}</td><td>${l.quantity}</td><td>${l.unit}</td><td>$${l.rate.toFixed(2)}</td><td>$${l.amount.toFixed(2)}</td></tr>`)
    .join("");

  const html = `
    <h2>Invoice ${invoice.number}</h2>
    <p>From: ${invoice.organization.name}</p>
    <p>To: ${invoice.customer.name}</p>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
      <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>${linesHtml}</tbody>
    </table>
    <p>Subtotal: $${invoice.subtotal.toFixed(2)}</p>
    <p>GST: $${invoice.taxAmount.toFixed(2)}</p>
    <p><strong>Total: $${invoice.total.toFixed(2)}</strong></p>
    ${invoice.notes ? `<p>${invoice.notes}</p>` : ""}
  `;

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
