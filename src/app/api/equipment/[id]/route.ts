import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.equipment.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const item = await prisma.equipment.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.quoteLine.updateMany({
      where: { equipmentId: id },
      data: { equipmentId: null },
    });
    await prisma.job.updateMany({
      where: { equipmentId: id },
      data: { equipmentId: null },
    });

    await prisma.equipment.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Equipment delete failed:", e);
    return NextResponse.json(
      { error: e.message || "Unable to delete this equipment." },
      { status: 400 }
    );
  }
}
