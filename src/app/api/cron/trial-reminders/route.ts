import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { trialDayNumber } from "@/lib/trial";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    return NextResponse.json({ skipped: "Email is not configured." });
  }
  const orgs = await prisma.organization.findMany({
    where: { subscriptionStatus: "trialing", status: "Approved", trialStart: { not: null }, trialEnd: { not: null } },
    include: { users: { take: 1, orderBy: { createdAt: "asc" } } },
  });
  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  for (const org of orgs) {
    const day = trialDayNumber(org.trialStart);
    const user = org.users[0];
    if (!user?.email || !day) continue;
    const mark = day === 20 ? "trialReminder20At" : day === 27 ? "trialReminder27At" : day === 30 ? "trialReminder30At" : null;
    if (!mark || (org as any)[mark]) continue;
    const claimed = await prisma.organization.updateMany({
      where: { id: org.id, [mark]: null },
      data: { [mark]: new Date() },
    });
    if (claimed.count !== 1) continue;
    const subject = day === 30 ? "Your EquipmentAI trial ends today" : `Your EquipmentAI trial: day ${day} of 30`;
    const body = day === 30
      ? "Your 30-day trial ends today. Add a payment method on the Billing page to keep access. Your data stays in place."
      : `You are on day ${day} of your 30-day EquipmentAI trial. No action is needed until the trial ends.`;
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM,
        to: user.email,
        subject,
        text: body,
      });
      sent += 1;
    } catch {
      await prisma.organization.update({ where: { id: org.id }, data: { [mark]: null } });
    }
  }
  return NextResponse.json({ sent });
}
