const BUCKET = "equipment-photos";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function photoStorageConfigured() {
  return !!config();
}

export async function uploadPhoto(path: string, bytes: Uint8Array, contentType: string) {
  const cfg = config();
  if (!cfg) throw new Error("Photo storage is not configured.");
  const res = await fetch(`${cfg.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.key}`,
      apikey: cfg.key,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: Buffer.from(bytes),
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
}

export async function downloadPhoto(path: string) {
  const cfg = config();
  if (!cfg) throw new Error("Photo storage is not configured.");
  if (path.includes("..") || path.startsWith("/")) throw new Error("Invalid path");
  const res = await fetch(`${cfg.url}/storage/v1/object/${BUCKET}/${path}`, {
    headers: { Authorization: `Bearer ${cfg.key}`, apikey: cfg.key },
  });
  if (!res.ok) throw new Error("File not found");
  return Buffer.from(await res.arrayBuffer());
}

export async function deletePhoto(path: string) {
  const cfg = config();
  if (!cfg || !path) return;
  if (path.includes("..") || path.startsWith("/")) return;
  await fetch(`${cfg.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${cfg.key}`, apikey: cfg.key },
  });
}
