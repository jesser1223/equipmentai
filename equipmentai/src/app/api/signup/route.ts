import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, companyName } = body;

    if (!name || !email || !password || !companyName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const org = await prisma.organization.create({
      data: { name: companyName },
    });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        organizationId: org.id,
      },
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Could not create account" }, { status: 500 });
  }
}
