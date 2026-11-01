import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

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
    where: { autoSendQuoteFollowUps: true },
    select: { id: true, name: true, email: true, replyToEmail: true, quoteFollowUpDays: true },
  });

  const results: { quoteId: string; status: string; detail?: string }[] = [];
  const now = new Date();
  const staleBefore = new Date(now.getTime() - CLAIM_TTL_MS);

  for (const org of orgs) {
    const delay = org.quoteFollowUpDays || 3;
    const quotes = await prisma.quote.findMany({
      where: {
        organizationId: org.id,
        status: "Sent",
        sentAt: { not: null },
        job: null,
        OR: [{ followUpClaimedAt: null }, { followUpClaimedAt: { lt: staleBefore } }],
      },
      include: { customer: true, emails: true, job: true },
    });

    for (const quote of quotes) {
      if (!quote.sentAt) continue;
      if (quote.expiresAt && quote.expiresAt < now) {
        results.push({ quoteId: quote.id, status: "skipped", detail: "expired" });
        continue;
      }
      if (quote.status === "Expired") continue;
      const eligibleAt = new Date(quote.sentAt);
      eligibleAt.setDate(eligibleAt.getDate() + delay);
      if (now < eligibleAt) continue;

      const original = quote.emails.some((e) => e.type === "QUOTE" && e.status === "Sent");
      if (!original) {
        results.push({ quoteId: quote.id, status: "skipped", detail: "no successful original email" });
        continue;
      }
      const followups = quote.emails.filter((e) => e.type === "FOLLOWUP");
      if (followups.some((e) => e.status === "Sent")) {
        results.push({ quoteId: quote.id, status: "skipped", detail: "already followed up" });
        continue;
      }
      if (followups.some((e) => e.status === "Queued" || e.status === "Uncertain")) {
        await prisma.quoteEmail.updateMany({
          where: { quoteId: quote.id, type: "FOLLOWUP", status: "Queued" },
          data: { status: "Uncertain", error: "Outcome unknown after claim expiry. Not retried." },
        });
        results.push({ quoteId: quote.id, status: "uncertain", detail: "not retried" });
        continue;
      }

      const to = quote.customer?.email?.trim();
      if (!to || !to.includes("@")) {
        results.push({ quoteId: quote.id, status: "skipped", detail: "no email" });
        continue;
      }

      const claim = await prisma.quote.updateMany({
        where: {
          id: quote.id,
          status: "Sent",
          OR: [{ followUpClaimedAt: null }, { followUpClaimedAt: { lt: staleBefore } }],
        },
        data: { followUpClaimedAt: now },
      });
      if (claim.count !== 1) {
        results.push({ quoteId: quote.id, status: "skipped", detail: "already claimed" });
        continue;
      }

      const fresh = await prisma.quote.findFirst({
        where: { id: quote.id, organizationId: org.id },
        include: { job: true },
      });
      if (!fresh || fresh.status !== "Sent" || fresh.job || (fresh.expiresAt && fresh.expiresAt < now)) {
        await prisma.quote.update({ where: { id: quote.id }, data: { followUpClaimedAt: null } });
        results.push({ quoteId: quote.id, status: "skipped", detail: "no longer eligible" });
        continue;
      }

      const subject = `Following up on quote ${quote.number}`;
      const record = await prisma.quoteEmail.create({
        data: {
          organizationId: org.id,
          quoteId: quote.id,
          to,
          subject,
          status: "Queued",
          type: "FOLLOWUP",
        },
      });

      const html = `<p>Hi,</p>
<p>Just following up on quote <strong>${escapeHtml(quote.number)}</strong> for ${escapeHtml(quote.jobName)}.</p>
<p>Total: $${quote.total.toFixed(2)}</p>
<p>Let us know if you have any questions or if you would like to proceed.</p>`;

      try {
        const resend = new Resend(apiKey);
        const result = await resend.emails.send({
          from: `${org.name} <${fromAddress}>`,
          to,
          replyTo: org.replyToEmail || org.email || undefined,
          subject,
          html,
        });
        if (result.error) {
          await prisma.quoteEmail.update({ where: { id: record.id }, data: { status: "Failed", error: result.error.message } });
          await prisma.quote.update({ where: { id: quote.id }, data: { followUpClaimedAt: null } });
          results.push({ quoteId: quote.id, status: "failed", detail: result.error.message });
          continue;
        }
        await prisma.quoteEmail.update({ where: { id: record.id }, data: { status: "Sent", providerId: result.data?.id } });
        results.push({ quoteId: quote.id, status: "sent" });
      } catch (err: any) {
        await prisma.quoteEmail.update({ where: { id: record.id }, data: { status: "Uncertain", error: err.message || "Send outcome unknown" } });
        results.push({ quoteId: quote.id, status: "uncertain", detail: err.message });
      }
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
