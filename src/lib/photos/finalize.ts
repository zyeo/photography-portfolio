import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { extractImageDimensions } from "@/lib/photos/dimensions";
import { extractExif } from "@/lib/photos/exif";
import { uploadPublicImageDerivatives } from "@/lib/photos/public-images";
import { assertValidOriginalImage } from "@/lib/photos/validation";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export async function loadStoredOriginal(supabase: Client, path: string, contentType: string) {
  const { data, error } = await supabase.storage.from("originals").download(path);
  if (error || !data) throw new Error("Uploaded original could not be found.");

  const buffer = await data.arrayBuffer();
  await assertValidOriginalImage(buffer, contentType);
  return buffer;
}

export async function buildPhotoFields(
  buffer: ArrayBuffer,
  originalFilename: string,
) {
  const metadata = await extractExif(buffer);
  const dimensions = extractImageDimensions(buffer);

  return {
    contentHash: createHash("sha256").update(Buffer.from(buffer)).digest("hex"),
    imageWidth: dimensions.width,
    imageHeight: dimensions.height,
    originalFilename,
    metadata,
  };
}

export async function buildPublicDerivatives(
  supabase: Client,
  imagePath: string,
  buffer: ArrayBuffer,
) {
  return uploadPublicImageDerivatives(supabase, imagePath, buffer);
}
