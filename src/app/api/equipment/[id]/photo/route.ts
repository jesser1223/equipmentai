import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";
import { deletePhoto, downloadPhoto, uploadPhoto } from "@/lib/photo-storage";

function imageType(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  return null;
}

function withUtm(url: string) {
  if (!url) return url;
  return url.includes("?") ? `${url}&${UTM}` : `${url}?${UTM}`;
}

async function owned(id: string) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return { error: blocked };
  if (!orgId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const item = await prisma.equipment.findFirst({ where: { id, organizationId: orgId } });
  if (!item) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { orgId, item };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await owned(id);
  if (result.error) return result.error;

  const body = await req.json();
  const photoId = String(body.photoId || "").trim();
  if (!photoId) return NextResponse.json({ error: "Photo is required." }, { status: 400 });

  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return NextResponse.json({ error: "Image search is not configured." }, { status: 503 });

  const res = await fetch(`https://api.unsplash.com/photos/${encodeURIComponent(photoId)}`, {
    headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
  });
  if (!res.ok) return NextResponse.json({ error: "That photo could not be verified." }, { status: 400 });
  const photo = await res.json();
  if (photo.id !== photoId || !photo.urls?.regular) {
    return NextResponse.json({ error: "Invalid photo." }, { status: 400 });
  }

  if (photo.links?.download_location) {
    await fetch(photo.links.download_location, {
      headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
    }).catch(() => null);
  }

  if (result.item.photoPath) await deletePhoto(result.item.photoPath);

  const updated = await prisma.equipment.update({
    where: { id },
    data: {
      photoSource: "unsplash",
      photoUrl: photo.urls.regular,
      photoSourceUrl: withUtm(photo.links?.html || ""),
      photoPhotographer: photo.user?.name || null,
      photoPhotographerUrl: withUtm(photo.user?.links?.html || ""),
      photoUnsplashId: photo.id,
      photoPath: null,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await owned(id);
  if (result.error) return result.error;
  if (result.item.photoPath) await deletePhoto(result.item.photoPath);
  const updated = await prisma.equipment.update({
    where: { id },
    data: {
      photoSource: null,
      photoUrl: null,
      photoSourceUrl: null,
      photoPhotographer: null,
      photoPhotographerUrl: null,
      photoUnsplashId: null,
      photoPath: null,
    },
  });
  return NextResponse.json(updated);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await owned(id);
  if (result.error) return result.error;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image." }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Image must be 8 MB or smaller." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = imageType(bytes);
  if (!type) return NextResponse.json({ error: "Use a real JPG, PNG, or WEBP image." }, { status: 400 });
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const path = `${result.orgId}/${id}/photo.${ext}`;
  if (result.item.photoPath && result.item.photoPath !== path) await deletePhoto(result.item.photoPath);
  await uploadPhoto(path, bytes, type);
  const updated = await prisma.equipment.update({
    where: { id },
    data: {
      photoSource: "upload",
      photoPath: path,
      photoUrl: null,
      photoSourceUrl: null,
      photoPhotographer: null,
      photoPhotographerUrl: null,
      photoUnsplashId: null,
    },
  });
  return NextResponse.json(updated);
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await owned(id);
  if (result.error) return result.error;
  if (!result.item.photoPath) return NextResponse.json({ error: "No uploaded photo" }, { status: 404 });
  const bytes = await downloadPhoto(result.item.photoPath);
  const type = result.item.photoPath.endsWith(".png") ? "image/png" : result.item.photoPath.endsWith(".webp") ? "image/webp" : "image/jpeg";
  return new NextResponse(bytes, { headers: { "Content-Type": type, "Cache-Control": "private, max-age=300" } });
}
