import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { extractExif } from "@/lib/photos/exif";
import { assertAcceptedImage, buildOriginalObjectPath } from "@/lib/photos/uploads";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);
  const medium = String(formData.get("medium") ?? "digital") as "digital" | "film";
  const locationName = String(formData.get("locationName") ?? "").trim() || null;
  const selected = formData.get("selected") === "on";

  if (!files.length) return NextResponse.json({ error: "At least one image is required." }, { status: 400 });

  const photos = [];
  const skippedDuplicates: string[] = [];

  for (const file of files) {
    assertAcceptedImage(file);
    const buffer = await file.arrayBuffer();
    const contentHash = createHash("sha256").update(Buffer.from(buffer)).digest("hex");

    const { data: existingPhoto } = await supabase
      .from("photos")
      .select("id")
      .eq("content_hash", contentHash)
      .maybeSingle();

    if (existingPhoto) {
      skippedDuplicates.push(file.name);
      continue;
    }

    const metadata = await extractExif(buffer);
    const imagePath = buildOriginalObjectPath(file);
    const { error: uploadError } = await supabase.storage.from("originals").upload(imagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data, error } = await supabase
      .from("photos")
      .insert({
        image_path: imagePath,
        original_filename: file.name,
        content_hash: contentHash,
        date_taken: metadata.dateTaken,
        location_name: locationName,
        latitude: metadata.latitude,
        longitude: metadata.longitude,
        camera: metadata.camera,
        lens: metadata.lens,
        aperture: metadata.aperture,
        shutter_speed: metadata.shutterSpeed,
        iso: metadata.iso,
        medium,
        selected,
        selected_size: selected ? "normal" : null,
      })
      .select("id, original_filename, location_name, medium, selected, date_taken, camera")
      .single();

    if (error) {
      await supabase.storage.from("originals").remove([imagePath]);
      if (error.code === "23505") {
        skippedDuplicates.push(file.name);
        continue;
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    photos.push(data);
  }

  return NextResponse.json({ photos, skippedDuplicates }, { status: 201 });
}
