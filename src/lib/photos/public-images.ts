type StorageClient = {
  storage: {
    from(bucket: string): {
      upload(
        path: string,
        fileBody: ArrayBuffer,
        options: { contentType: string; upsert: boolean },
      ): Promise<{ error: { message: string } | null }>;
    };
  };
};

export async function uploadPublicImageCopy(
  supabase: StorageClient,
  path: string,
  buffer: ArrayBuffer,
  contentType: string,
) {
  const { error } = await supabase.storage.from("public-images").upload(path, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Public image upload failed: ${error.message}`);
  }

  return path;
}
