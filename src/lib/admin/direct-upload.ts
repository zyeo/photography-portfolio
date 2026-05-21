"use client";

import { createClient } from "@/lib/supabase/client";

const acceptedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/avif",
]);

type PrepareUploadResponse = {
  path?: string;
  token?: string;
  error?: string;
};

export async function directUploadOriginal(file: File) {
  if (!acceptedImageTypes.has(file.type)) {
    throw new Error("Please choose a supported image file before uploading.");
  }

  if (file.size === 0) {
    throw new Error("Image file is empty.");
  }

  const prepareResponse = await fetch("/api/admin/uploads/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
    }),
  });
  const preparePayload = (await prepareResponse.json()) as PrepareUploadResponse;

  if (!prepareResponse.ok || !preparePayload.path || !preparePayload.token) {
    throw new Error(preparePayload.error ?? "Could not prepare upload.");
  }

  const supabase = createClient();
  const { error } = await supabase.storage
    .from("originals")
    .uploadToSignedUrl(preparePayload.path, preparePayload.token, file, {
      contentType: file.type,
    });

  if (error) throw new Error(error.message);

  return {
    path: preparePayload.path,
    contentType: file.type,
    originalFilename: file.name,
  };
}
