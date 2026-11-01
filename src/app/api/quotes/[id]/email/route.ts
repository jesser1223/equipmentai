import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { buildQuotePdf } from "@/lib/quote-pdf";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br/>");
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const quote = await prisma.quote.findFirst({
    where: { id, organizationId: orgId },
    include: { customer: true, organization: true, lines: true },
  });
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const to = (body.to || quote.customer?.email || "").trim();
  if (!to || !to.includes("@")) {
    return NextResponse.json({ error: "Customer email is required" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM?.trim();
  if (!apiKey || !fromAddress || fromAddress.endsWith("@resend.dev")) {
    return NextResponse.json({ error: "Email is not configured" }, { status: 400 });
  }

  const subject = body.subject?.trim() || `Quote ${quote.number} from ${quote.organization.name}`;
  const record = await prisma.quoteEmail.create({
    data: {
      organizationId: orgId,
      quoteId: quote.id,
      to,
      subject,
      status: "Queued",
      type: "QUOTE",
      userId: (session?.user as any)?.id,
    },
  });

  const lines = quote.lines
    .map((l) => `<tr><td>${escapeHtml(l.description)}</td><td>${l.quantity}</td><td>$${l.amount.toFixed(2)}</td></tr>`)
    .join("");
  const html = `<p>Quote <strong>${escapeHtml(quote.number)}</strong> for ${escapeHtml(quote.jobName)}.</p>
<table>${lines}</table>
<p>Total: $${quote.total.toFixed(2)}</p>
${quote.notes ? `<p>${escapeHtml(quote.notes)}</p>` : ""}
<p>Let us know if you have questions or would like to proceed.</p>`;

  try {
    const resend = new Resend(apiKey);
    const pdf = await buildQuotePdf(quote);
    const result = await resend.emails.send({
      from: `${quote.organization.name} <${fromAddress}>`,
      to,
      replyTo: quote.organization.replyToEmail || quote.organization.email || undefined,
      subject,
      html,
      attachments: [{ filename: `${quote.number}.pdf`, content: Buffer.from(pdf) }],
    });
    if (result.error) {
      await prisma.quoteEmail.update({
        where: { id: record.id },
        data: { status: "Failed", error: result.error.message },
      });
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    await prisma.quoteEmail.update({
      where: { id: record.id },
      data: { status: "Sent", providerId: result.data?.id },
    });
    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: quote.status === "Draft" ? "Sent" : quote.status,
        sentAt: quote.sentAt || new Date(),
      },
    });
    return NextResponse.json({ ok: true, status: "Sent" });
  } catch (err: any) {
    await prisma.quoteEmail.update({
      where: { id: record.id },
      data: { status: "Uncertain", error: err.message || "Send outcome unknown" },
    });
    return NextResponse.json({ error: "Email outcome is uncertain. It was not marked as sent." }, { status: 500 });
  }
}
