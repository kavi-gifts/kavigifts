import "server-only";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const SIZES = [
  { key: "thumb", width: 400, quality: 72 },
  { key: "medium", width: 900, quality: 78 },
  { key: "large", width: 1600, quality: 80 },
] as const;

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export type StoredImage = { url_thumb: string; url_medium: string; url_large: string };

/** Şəkli 3 ölçüyə sıxır, WebP formatına çevirir və Supabase Storage-ə yükləyir. */
export async function processAndUpload(
  supabase: SupabaseClient,
  file: File,
  _watermark?: string,
): Promise<StoredImage> {
  if (!ALLOWED.includes(file.type)) throw new Error("Yalnız JPG, PNG və ya WebP şəkil yükləyin.");
  if (file.size > MAX_BYTES) throw new Error("Şəkil 8MB-dan böyük ola bilməz.");

  const input = Buffer.from(await file.arrayBuffer());
  const id = randomUUID();
  const out: Record<string, string> = {};

  for (const s of SIZES) {
    const webp = await sharp(input)
      .rotate()
      .resize({ width: s.width, withoutEnlargement: true })
      .webp({ quality: s.quality })
      .toBuffer();

    const path = `${id}/${s.key}.webp`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, webp, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
    if (error) throw new Error(error.message);
    out[s.key] = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }
  return { url_thumb: out.thumb, url_medium: out.medium, url_large: out.large };
}

/** Public URL-dən storage yolunu çıxarıb faylları silir. */
export async function removeImageFiles(supabase: SupabaseClient, urls: string[]) {
  const marker = "/product-images/";
  const paths = urls
    .map((u) => u.split(marker)[1])
    .filter(Boolean);
  if (paths.length) await supabase.storage.from("product-images").remove(paths);
}
