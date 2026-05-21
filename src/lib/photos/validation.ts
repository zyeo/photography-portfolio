import sharp from "sharp";

const JPEG_MIME_TYPES = new Set(["image/jpeg"]);
const JPEG_EOI = Buffer.from([0xff, 0xd9]);

export const INCOMPLETE_IMAGE_ERROR =
  "Upload appears incomplete or corrupted, possibly because it is too large for the current route-based upload path.";

function hasJpegEndMarker(buffer: ArrayBuffer) {
  const bytes = Buffer.from(buffer);
  return bytes.length >= JPEG_EOI.length && bytes.subarray(-JPEG_EOI.length).equals(JPEG_EOI);
}

export async function assertValidOriginalImage(buffer: ArrayBuffer, contentType: string) {
  if (JPEG_MIME_TYPES.has(contentType) && !hasJpegEndMarker(buffer)) {
    throw new Error(INCOMPLETE_IMAGE_ERROR);
  }

  try {
    await sharp(Buffer.from(buffer)).metadata();
  } catch {
    throw new Error(INCOMPLETE_IMAGE_ERROR);
  }
}
