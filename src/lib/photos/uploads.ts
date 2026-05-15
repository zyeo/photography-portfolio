const acceptedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/avif",
]);

export function assertAcceptedImage(file: File) {
  if (!acceptedImageTypes.has(file.type)) {
    throw new Error("Unsupported image type.");
  }

  if (file.size === 0) {
    throw new Error("Image file is empty.");
  }
}

export function buildOriginalObjectPath(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  return `${crypto.randomUUID()}/original.${extension}`;
}
