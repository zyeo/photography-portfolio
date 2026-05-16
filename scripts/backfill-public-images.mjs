import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

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
  `${supabaseUrl}/rest/v1/photos?select=id,image_path,public_image_path&published=eq.true&public_image_path=is.null`,
  { headers },
);

if (!photosResponse.ok) {
  throw new Error(`Failed to load published photos: ${await photosResponse.text()}`);
}

const photos = await photosResponse.json();

for (const photo of photos) {
  const encodedPath = encodeStoragePath(photo.image_path);
  const originalResponse = await fetch(`${supabaseUrl}/storage/v1/object/originals/${encodedPath}`, { headers });

  if (!originalResponse.ok) {
    console.warn(`Skipping ${photo.id}: failed to download original (${originalResponse.status})`);
    continue;
  }

  const buffer = await originalResponse.arrayBuffer();
  const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/public-images/${encodedPath}`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": originalResponse.headers.get("content-type") ?? "application/octet-stream",
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!uploadResponse.ok) {
    console.warn(`Skipping ${photo.id}: failed to upload public copy (${uploadResponse.status})`);
    continue;
  }

  const updateResponse = await fetch(`${supabaseUrl}/rest/v1/photos?id=eq.${photo.id}`, {
    method: "PATCH",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ public_image_path: photo.image_path }),
  });

  if (!updateResponse.ok) {
    console.warn(`Uploaded ${photo.id}, but failed to update row (${updateResponse.status})`);
    continue;
  }

  console.log(`Backfilled ${photo.id}`);
}
