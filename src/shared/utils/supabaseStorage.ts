import { config } from "../config";

export const uploadToSupabaseStorage = async (path: string, base64: string, contentType: string) => {
  const url = `${config.supabase.url}/storage/v1/object/${config.supabase.storageBucket}/${path}`;
  const body = Buffer.from(base64, "base64");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.supabase.serviceRoleKey}`,
      "Content-Type": contentType || "application/octet-stream",
      "x-upsert": "true",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase upload failed: ${response.status} ${text}`);
  }

  return path;
};

export const buildSupabasePublicUrl = (path: string) => {
  const safePath = encodeURI(path);
  return `${config.supabase.url}/storage/v1/object/public/${config.supabase.storageBucket}/${safePath}`;
};
