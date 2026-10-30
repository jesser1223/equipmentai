import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { buildInvoicePdf } from "@/lib/invoice-pdf";

const CLAIM_TTL_MS = 30 * 60 * 1000;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br/>");
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM?.trim();
  if (!apiKey || !fromAddress || fromAddress.endsWith("@resend.dev")) {
    return NextResponse.json({ ok: false, error: "Email is not configured" }, { status: 500 });
  }

  const orgs = await prisma.organization.findMany({
    where: { autoSendOverdueReminders: true },
    select: { id: true, name: true, email: true, replyToEmail: true, paymentTerms: true, overdueReminderDays: true },
  });

  const results: { invoiceId: string; status: string; detail?: string }[] = [];
  const now = new Date();
  const staleBefore = new Date(now.getTime() - CLAIM_TTL_MS);

  for (const org of orgs) {
    const delay = org.overdueReminderDays || 7;
    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId: org.id,
        status: { in: ["Issued", "Partially Paid"] },
        dueDate: { not: null },
        OR: [{ overdueReminderClaimedAt: null }, { overdueReminderClaimedAt: { lt: staleBefore } }],
      },
      include: { customer: true, lines: true, payments: true, organization: true, emails: true },
    });

    for (const invoice of invoices) {
      if (!invoice.dueDate) continue;
      const eligibleAt = new Date(invoice.dueDate);
      eligibleAt.setDate(eligibleAt.getDate() + delay);
      if (now < eligibleAt) continue;

      const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
      const balance = Math.max(0, invoice.total - paid);
      if (balance <= 0.009) continue;

      const reminders = invoice.emails.filter((e) => e.type === "REMINDER");
      if (reminders.some((e) => e.status === "Sent")) {
        if (!invoice.overdueReminderClaimedAt) {
          await prisma.invoice.update({ where: { id: invoice.id }, data: { overdueReminderClaimedAt: now } });
        }
        results.push({ invoiceId: invoice.id, status: "skipped", detail: "already sent" });
        continue;
      }
      if (reminders.some((e) => e.status === "Queued" || e.status === "Uncertain")) {
        await prisma.invoiceEmail.updateMany({
          where: { invoiceId: invoice.id, type: "REMINDER", status: "Queued" },
          data: { status: "Uncertain", error: "Outcome unknown after claim expiry. Not retried." },
        });
        results.push({ invoiceId: invoice.id, status: "uncertain", detail: "not retried" });
        continue;
      }

      const to = invoice.customer?.email?.trim();
      if (!to || !to.includes("@")) {
        results.push({ invoiceId: invoice.id, status: "skipped", detail: "no email" });
        continue;
      }

      const claim = await prisma.invoice.updateMany({
        where: {
          id: invoice.id,
          OR: [{ overdueReminderClaimedAt: null }, { overdueReminderClaimedAt: { lt: staleBefore } }],
        },
        data: { overdueReminderClaimedAt: now },
      });
      if (claim.count !== 1) {
        results.push({ invoiceId: invoice.id, status: "skipped", detail: "already claimed" });
        continue;
      }

      const subject = `Payment reminder: Invoice ${invoice.number} from ${org.name}`;
      const record = await prisma.invoiceEmail.create({
        data: {
          organizationId: org.id,
          invoiceId: invoice.id,
          to,
          subject,
          status: "Queued",
          type: "REMINDER",
        },
      });

      try {
        const resend = new Resend(apiKey);
        const pdf = await buildInvoicePdf(invoice);
        const due = escapeHtml(new Date(invoice.dueDate).toLocaleDateString());
        const terms = org.paymentTerms ? `<p>${escapeHtml(org.paymentTerms)}</p>` : "";
        const html = `<p>This is a reminder that invoice <strong>${escapeHtml(invoice.number)}</strong> is overdue.</p>
<p>Due date: ${due}<br/>Outstanding balance: $${balance.toFixed(2)}</p>
${terms}
<p>Please arrange payment at your earliest convenience.</p>`;
        const result = await resend.emails.send({
          from: `${org.name} <${fromAddress}>`,
          to,
          replyTo: org.replyToEmail || org.email || undefined,
          subject,
          html,
          attachments: [{ filename: `${invoice.number}.pdf`, content: Buffer.from(pdf) }],
        });
        if (result.error) {
          await prisma.invoiceEmail.update({
            where: { id: record.id },
            data: { status: "Failed", error: result.error.message },
          });
          await prisma.invoice.update({ where: { id: invoice.id }, data: { overdueReminderClaimedAt: null } });
          results.push({ invoiceId: invoice.id, status: "failed", detail: result.error.message });
          continue;
        }
        await prisma.invoiceEmail.update({
          where: { id: record.id },
          data: { status: "Sent", providerId: result.data?.id },
        });
        results.push({ invoiceId: invoice.id, status: "sent" });
      } catch (err: any) {
        // Network/timeout after send may be ambiguous. Do not clear the claim.
        await prisma.invoiceEmail.update({
          where: { id: record.id },
          data: { status: "Uncertain", error: err.message || "Send outcome unknown" },
        });
        results.push({ invoiceId: invoice.id, status: "uncertain", detail: err.message });
      }
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
