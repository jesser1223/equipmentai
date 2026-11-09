import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";
import { deletePdf, downloadPdf } from "@/lib/document-storage";

async function ownedDoc(equipmentId: string, docId: string) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return { error: blocked };
  if (!orgId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const doc = await prisma.equipmentDocument.findFirst({
    where: { id: docId, equipmentId, organizationId: orgId },
  });
  if (!doc) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (doc.storagePath.includes("..") || doc.storagePath.startsWith("/")) {
    return { error: NextResponse.json({ error: "Invalid document path" }, { status: 400 }) };
  }
  return { doc };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await params;
  const result = await ownedDoc(id, docId);
  if (result.error) return result.error;
  try {
    const bytes = await downloadPdf(result.doc.storagePath);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${result.doc.fileName.replace(/"/g, "")}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await params;
  const result = await ownedDoc(id, docId);
  if (result.error) return result.error;
  try {
    await deletePdf(result.doc.storagePath);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Could not delete file" }, { status: 500 });
  }
  await prisma.equipmentDocument.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}
