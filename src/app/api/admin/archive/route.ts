import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { extractExif } from "@/lib/photos/exif";
import { extractImageDimensions } from "@/lib/photos/dimensions";
import { uploadPublicImageCopy } from "@/lib/photos/public-images";
import { assertAcceptedImage, buildOriginalObjectPath } from "@/lib/photos/uploads";
import { createClient } from "@/lib/supabase/server";

async function parseArchiveRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.startsWith("multipart/form-data")) {
    const formData = await request.formData();
    return {
      files: formData.getAll("files").filter((value): value is File => value instanceof File),
      medium: String(formData.get("medium") ?? "digital") as "digital" | "film",
      locationName: String(formData.get("locationName") ?? "").trim() || null,
      selected: formData.get("selected") === "on",
    };
  }

  const encodedName = request.headers.get("x-archive-file-name");
  if (!encodedName) throw new Error("Missing archive filename.");

  const buffer = await request.arrayBuffer();
  const file = new File([buffer], decodeURIComponent(encodedName), { type: contentType });

  return {
    files: [file],
    medium: (request.headers.get("x-archive-medium") ?? "digital") as "digital" | "film",
    locationName: decodeURIComponent(request.headers.get("x-archive-location") ?? "").trim() || null,
    selected: request.headers.get("x-archive-selected") === "true",
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { files, medium, locationName, selected } = await parseArchiveRequest(request);

    if (!files.length) return NextResponse.json({ error: "At least one image is required." }, { status: 400 });

    const photos = [];
    const skippedDuplicates: string[] = [];
    const failedFiles: Array<{ name: string; error: string }> = [];

    for (const file of files) {
      let imagePath: string | null = null;
      let publicImagePath: string | null = null;

      try {
        assertAcceptedImage(file);
        const buffer = await file.arrayBuffer();
        const contentHash = createHash("sha256").update(Buffer.from(buffer)).digest("hex");
        const dimensions = extractImageDimensions(buffer);

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
        imagePath = buildOriginalObjectPath(file);
        const { error: uploadError } = await supabase.storage.from("originals").upload(imagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });
        if (uploadError) throw new Error(uploadError.message);

        if (selected) {
          publicImagePath = await uploadPublicImageCopy(supabase, imagePath, buffer, file.type);
        }

        const { data, error } = await supabase
          .from("photos")
          .insert({
            image_path: imagePath,
            public_image_path: publicImagePath,
            image_width: dimensions.width,
            image_height: dimensions.height,
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
            published: selected,
          })
          .select("id, original_filename, location_name, medium, selected, date_taken, camera")
          .single();

        if (error) {
          if (error.code === "23505") {
            if (publicImagePath) {
              await supabase.storage.from("public-images").remove([publicImagePath]);
            }
            await supabase.storage.from("originals").remove([imagePath]);
            skippedDuplicates.push(file.name);
            continue;
          }
          throw new Error(error.message);
        }
        photos.push(data);
      } catch (error) {
        if (publicImagePath) {
          await supabase.storage.from("public-images").remove([publicImagePath]);
        }
        if (imagePath) {
          await supabase.storage.from("originals").remove([imagePath]);
        }
        failedFiles.push({
          name: file.name,
          error: error instanceof Error ? error.message : "Upload failed.",
        });
      }
    }

    return NextResponse.json({ photos, skippedDuplicates, failedFiles }, { status: 201 });
  } catch (error) {
    console.error("Archive upload request failed before file processing.", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Archive upload request failed." },
      { status: 500 },
    );
  }
}
