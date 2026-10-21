import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import {
  generateResetToken,
  hashResetToken,
  isWithinRateLimit,
  rateWindowStart,
  resetExpiry,
} from "@/lib/password-reset";

const GENERIC = {
  ok: true,
  message: "If an account exists for that email, you’ll receive reset instructions shortly.",
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json(GENERIC);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json(GENERIC);

  const recent = await prisma.passwordResetToken.count({
    where: { userId: user.id, createdAt: { gte: rateWindowStart() } },
  });
  if (!isWithinRateLimit(recent)) {
    return NextResponse.json(GENERIC);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM?.trim();
  if (!apiKey || !fromAddress || fromAddress.endsWith("@resend.dev")) {
    console.error("[password-reset] email is not configured");
    return NextResponse.json(GENERIC);
  }

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: resetExpiry() },
    }),
  ]);

  const baseUrl = (process.env.AUTH_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
  if (!baseUrl) {
    console.error("[password-reset] AUTH_URL is not set");
    return NextResponse.json(GENERIC);
  }

  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: `EquipmentAI <${fromAddress}>`,
    to: user.email,
    subject: "Reset your EquipmentAI password",
    html: `<p>We received a request to reset your EquipmentAI password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 30 minutes and can only be used once.</p><p>If you did not request this, you can ignore this email.</p>`,
  });

  if (result.error) {
    console.error("[password-reset] send failed", result.error.message);
  }

  return NextResponse.json(GENERIC);
}
