import sharp from "sharp";

type StorageClient = {
  storage: {
    from(bucket: string): {
      upload(
        path: string,
        fileBody: ArrayBuffer | Buffer,
        options: { contentType: string; upsert: boolean },
      ): Promise<{ error: { message: string } | null }>;
    };
  };
};

const GALLERY_LONG_EDGE = 1200;
const LIGHTBOX_LONG_EDGE = 2200;

function derivativePath(imagePath: string, filename: "gallery.jpg" | "lightbox.jpg") {
  const parts = imagePath.split("/");
  parts.pop();
  return [...parts, filename].join("/");
}

async function resizeJpeg(buffer: ArrayBuffer, longEdge: number, quality: number) {
  return sharp(Buffer.from(buffer))
    .rotate()
    .resize({
      width: longEdge,
      height: longEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality })
    .toBuffer();
}

async function uploadPublicImage(
  supabase: StorageClient,
  path: string,
  buffer: Buffer,
) {
  const { error } = await supabase.storage.from("public-images").upload(path, buffer, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) {
    throw new Error(`Public image upload failed: ${error.message}`);
  }
}

export async function uploadPublicImageDerivatives(
  supabase: StorageClient,
  imagePath: string,
  buffer: ArrayBuffer,
) {
  const galleryImagePath = derivativePath(imagePath, "gallery.jpg");
  const lightboxImagePath = derivativePath(imagePath, "lightbox.jpg");
  const [galleryBuffer, lightboxBuffer] = await Promise.all([
    resizeJpeg(buffer, GALLERY_LONG_EDGE, 82),
    resizeJpeg(buffer, LIGHTBOX_LONG_EDGE, 88),
  ]);

  await Promise.all([
    uploadPublicImage(supabase, galleryImagePath, galleryBuffer),
    uploadPublicImage(supabase, lightboxImagePath, lightboxBuffer),
  ]);

  return {
    galleryImagePath,
    lightboxImagePath,
  };
}
