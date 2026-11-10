const BUCKET = "equipment-documents";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function storageConfigured() {
  return !!config();
}

export async function createSignedUpload(path: string) {
  const cfg = config();
  if (!cfg) throw new Error("Document storage is not configured.");
  const res = await fetch(`${cfg.url}/storage/v1/object/upload/sign/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.key}`,
      apikey: cfg.key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const detail = await res.text();
  if (!res.ok) {
    if (res.status === 404 || /bucket/i.test(detail)) {
      throw new Error("Document storage bucket is missing. Create a private Supabase bucket named equipment-documents.");
    }
    throw new Error(`Could not start upload (${res.status})${detail ? `: ${detail.slice(0, 180)}` : ""}`);
  }
  const data = JSON.parse(detail);
  const raw = String(data.url || "");
  const uploadUrl = raw.startsWith("http") ? raw : `${cfg.url}/storage/v1/${raw.replace(/^\//, "")}`;
  return { uploadUrl, token: String(data.token || "") };
}
  const cfg = config();
  if (!cfg) throw new Error("Document storage is not configured.");
  const res = await fetch(`${cfg.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.key}`,
      apikey: cfg.key,
      "Content-Type": "application/pdf",
      "x-upsert": "false",
    },
    body: Buffer.from(bytes),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    if (res.status === 404 || /bucket/i.test(detail)) {
      throw new Error("Document storage bucket is missing. Create a private Supabase bucket named equipment-documents.");
    }
    throw new Error(`Upload failed (${res.status})${detail ? `: ${detail.slice(0, 180)}` : ""}`);
  }
}

export async function downloadPdf(path: string) {
  const cfg = config();
  if (!cfg) throw new Error("Document storage is not configured.");
  if (path.includes("..") || path.startsWith("/")) throw new Error("Invalid path");
  const res = await fetch(`${cfg.url}/storage/v1/object/${BUCKET}/${path}`, {
    headers: { Authorization: `Bearer ${cfg.key}`, apikey: cfg.key },
  });
  if (!res.ok) throw new Error("File not found");
  return Buffer.from(await res.arrayBuffer());
}

export async function deletePdf(path: string) {
  const cfg = config();
  if (!cfg) throw new Error("Document storage is not configured.");
  if (path.includes("..") || path.startsWith("/")) throw new Error("Invalid path");
  const res = await fetch(`${cfg.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${cfg.key}`, apikey: cfg.key },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Storage delete failed (${res.status})`);
  }
}
