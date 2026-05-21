import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

async function loadLocalEnv() {
  try {
    const envPath = fileURLToPath(new URL("../.env.local", import.meta.url));
    const contents = await readFile(envPath, "utf8");

    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator);
      const value = trimmed.slice(separator + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Environment variables may already be supplied by the shell or deployment runtime.
  }
}

function encodeStoragePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function derivativePath(imagePath, filename) {
  const parts = imagePath.split("/");
  parts.pop();
  return [...parts, filename].join("/");
}

async function resizeJpeg(buffer, longEdge, quality) {
  return sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: longEdge, height: longEdge, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality })
    .toBuffer();
}

await loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
};

const photosResponse = await fetch(
  `${supabaseUrl}/rest/v1/photos?select=id,image_path,public_image_path,gallery_image_path&published=eq.true`,
  { headers },
);

if (!photosResponse.ok) {
  throw new Error(`Failed to load published photos: ${await photosResponse.text()}`);
}

const photos = await photosResponse.json();

for (const photo of photos) {
  try {
    const encodedOriginalPath = encodeStoragePath(photo.image_path);
    const originalResponse = await fetch(`${supabaseUrl}/storage/v1/object/originals/${encodedOriginalPath}`, { headers });

    if (!originalResponse.ok) {
      console.warn(`Skipping ${photo.id}: failed to download original (${originalResponse.status})`);
      continue;
    }

    const originalBuffer = Buffer.from(await originalResponse.arrayBuffer());
    const galleryImagePath = derivativePath(photo.image_path, "gallery.jpg");
    const lightboxImagePath = derivativePath(photo.image_path, "lightbox.jpg");
    const [galleryBuffer, lightboxBuffer] = await Promise.all([
      resizeJpeg(originalBuffer, 1200, 82),
      resizeJpeg(originalBuffer, 2200, 88),
    ]);

    for (const [path, buffer] of [
      [galleryImagePath, galleryBuffer],
      [lightboxImagePath, lightboxBuffer],
    ]) {
      const uploadResponse = await fetch(
        `${supabaseUrl}/storage/v1/object/public-images/${encodeStoragePath(path)}`,
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "image/jpeg",
            "x-upsert": "true",
          },
          body: buffer,
        },
      );

      if (!uploadResponse.ok) {
        throw new Error(`failed to upload ${path} (${uploadResponse.status})`);
      }
    }

    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/photos?id=eq.${photo.id}`, {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        gallery_image_path: galleryImagePath,
        public_image_path: lightboxImagePath,
      }),
    });

    if (!updateResponse.ok) {
      throw new Error(`failed to update row (${updateResponse.status})`);
    }

    console.log(`Backfilled ${photo.id}`);
  } catch (error) {
    console.warn(`Skipping ${photo.id}: ${error instanceof Error ? error.message : "derivative generation failed"}`);
  }
}
