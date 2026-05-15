import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertAcceptedImage, buildOriginalObjectPath } from "@/lib/photos/uploads";
import { extractExif } from "@/lib/photos/exif";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required." }, { status: 400 });
  }

  try {
    assertAcceptedImage(file);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid image." },
      { status: 400 },
    );
  }

  const buffer = await file.arrayBuffer();
  const metadata = await extractExif(buffer);
  const imagePath = buildOriginalObjectPath(file);

  const { error: uploadError } = await supabase.storage
    .from("originals")
    .upload(imagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data, error: insertError } = await supabase
    .from("photos")
    .insert({
      image_path: imagePath,
      original_filename: file.name,
      date_taken: metadata.dateTaken,
      camera: metadata.camera,
      lens: metadata.lens,
      aperture: metadata.aperture,
      shutter_speed: metadata.shutterSpeed,
      iso: metadata.iso,
      latitude: metadata.latitude,
      longitude: metadata.longitude,
      focal_point_x: 0.5,
      focal_point_y: 0.5,
    })
    .select("id, image_path, original_filename, date_taken, camera, lens, aperture, shutter_speed, iso")
    .single();

  if (insertError) {
    await supabase.storage.from("originals").remove([imagePath]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ photo: data }, { status: 201 });
}
