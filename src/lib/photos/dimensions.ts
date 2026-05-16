import { imageSize } from "image-size";

export type ImageDimensions = {
  width: number;
  height: number;
};

export function extractImageDimensions(buffer: ArrayBuffer): ImageDimensions {
  const dimensions = imageSize(Buffer.from(buffer));

  if (!dimensions.width || !dimensions.height) {
    throw new Error("Could not determine image dimensions.");
  }

  return {
    width: dimensions.width,
    height: dimensions.height,
  };
}
