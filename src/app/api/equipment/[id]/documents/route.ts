import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";
import { storageConfigured, uploadPdf } from "@/lib/document-storage";

const CATEGORIES = [
  "Insurance",
  "Pre-trip inspection",
  "Inspection report",
  "Maintenance record",
  "Ownership",
  "Safety certificate",
  "Operator manual",
  "Other",
];

async function ownedEquipment(id: string) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return { error: blocked };
  if (!orgId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const item = await prisma.equipment.findFirst({ where: { id, organizationId: orgId } });
  if (!item) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { orgId, userId: (session?.user as any)?.id as string | undefined, item };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await ownedEquipment(id);
    if (result.error) return result.error;
    const docs = await prisma.equipmentDocument.findMany({
      where: { equipmentId: id, organizationId: result.orgId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(docs);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Could not load documents." }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await ownedEquipment(id);
    if (result.error) return result.error;
    if (!storageConfigured()) {
      return NextResponse.json({ error: "Document storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const name = String(form.get("name") || "").trim();
    const category = String(form.get("category") || "Other");
    if (!name) return NextResponse.json({ error: "Document name is required." }, { status: 400 });
    if (!CATEGORIES.includes(category)) return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: "PDF file is required." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File must be 10 MB or smaller." }, { status: 400 });

    const bytes = new Uint8Array(await file.arrayBuffer());
    const header = new TextDecoder().decode(bytes.slice(0, 5));
    if (header !== "%PDF-" || (file.type && file.type !== "application/pdf")) {
      return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
    }

    const doc = await prisma.equipmentDocument.create({
      data: {
        name,
        category,
        fileName: file.name || `${name}.pdf`,
        mimeType: "application/pdf",
        size: file.size,
        storagePath: "pending",
        equipmentId: id,
        organizationId: result.orgId!,
        uploadedBy: result.userId,
      },
    });

    const path = `${result.orgId}/${id}/${doc.id}.pdf`;
    try {
      await uploadPdf(path, bytes);
    } catch (err: any) {
      await prisma.equipmentDocument.delete({ where: { id: doc.id } }).catch(() => null);
      return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
    }

    const saved = await prisma.equipmentDocument.update({
      where: { id: doc.id },
      data: { storagePath: path },
    });
    return NextResponse.json(saved, { status: 201 });
  } catch (err: any) {
    const message = String(err?.message || "");
    if (/equipmentDocument|does not exist|P2021/i.test(message)) {
      return NextResponse.json({ error: "Document table is missing. Run npx prisma db push." }, { status: 500 });
    }
    return NextResponse.json({ error: message || "Upload failed" }, { status: 500 });
  }
}
