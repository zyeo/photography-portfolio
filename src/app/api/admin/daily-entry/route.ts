import { NextResponse } from "next/server";
import { extractExif } from "@/lib/photos/exif";
import { extractImageDimensions } from "@/lib/photos/dimensions";
import { uploadPublicImageCopy } from "@/lib/photos/public-images";
import { assertAcceptedImage, buildOriginalObjectPath } from "@/lib/photos/uploads";
import { createClient } from "@/lib/supabase/server";

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Photograph is required." }, { status: 400 });
  }

  try {
    assertAcceptedImage(file);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid image." },
      { status: 400 },
    );
  }

  const title = String(formData.get("title") ?? "").trim();
  const reflection = String(formData.get("reflection") ?? "").trim();
  const entryDate = String(formData.get("entryDate") ?? "").trim();
  const locationName = String(formData.get("locationName") ?? "").trim() || null;
  const weather = String(formData.get("weather") ?? "").trim() || null;

  if (!title || !reflection || !entryDate) {
    return NextResponse.json(
      { error: "Title, reflection, and entry date are required." },
      { status: 400 },
    );
  }

  const buffer = await file.arrayBuffer();
  const metadata = await extractExif(buffer);
  const dimensions = extractImageDimensions(buffer);
  const imagePath = buildOriginalObjectPath(file);

  const { error: uploadError } = await supabase.storage.from("originals").upload(imagePath, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  let publicImagePath: string;
  try {
    publicImagePath = await uploadPublicImageCopy(supabase, imagePath, buffer, file.type);
  } catch (error) {
    await supabase.storage.from("originals").remove([imagePath]);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Public image upload failed." },
      { status: 500 },
    );
  }

  if (parseBoolean(formData.get("pinnedHero"))) {
    await supabase.from("photos").update({ pinned_hero: false }).eq("pinned_hero", true);
  }

  const { data: photo, error: photoError } = await supabase
    .from("photos")
    .insert({
      image_path: imagePath,
      public_image_path: publicImagePath,
      image_width: dimensions.width,
      image_height: dimensions.height,
      original_filename: file.name,
      date_taken: metadata.dateTaken,
      location_name: locationName,
      latitude: metadata.latitude,
      longitude: metadata.longitude,
      camera: metadata.camera,
      lens: metadata.lens,
      aperture: metadata.aperture,
      shutter_speed: metadata.shutterSpeed,
      iso: metadata.iso,
      hero_approved: parseBoolean(formData.get("heroApproved")),
      pinned_hero: parseBoolean(formData.get("pinnedHero")),
      focal_point_x: Number(formData.get("focalPointX") ?? 0.5),
      focal_point_y: Number(formData.get("focalPointY") ?? 0.5),
      published: true,
    })
    .select("id")
    .single();

  if (photoError) {
    await supabase.storage.from("public-images").remove([publicImagePath]);
    await supabase.storage.from("originals").remove([imagePath]);
    return NextResponse.json({ error: photoError.message }, { status: 500 });
  }

  const { data: entry, error: entryError } = await supabase
    .from("journal_entries")
    .insert({
      photo_id: photo.id,
      entry_date: entryDate,
      title,
      reflection,
      weather,
      published: true,
    })
    .select("id, entry_date, title")
    .single();

  if (entryError) {
    await supabase.from("photos").delete().eq("id", photo.id);
    await supabase.storage.from("public-images").remove([publicImagePath]);
    await supabase.storage.from("originals").remove([imagePath]);
    return NextResponse.json({ error: entryError.message }, { status: 500 });
  }

  return NextResponse.json({ entry }, { status: 201 });
}
