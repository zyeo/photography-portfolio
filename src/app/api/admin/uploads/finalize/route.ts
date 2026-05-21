import { NextResponse } from "next/server";
import { buildPhotoFields, buildPublicDerivatives, loadStoredOriginal } from "@/lib/photos/finalize";
import { assertAcceptedImage } from "@/lib/photos/uploads";
import { createClient } from "@/lib/supabase/server";

type CommonFinalize = {
  path: string;
  originalFilename: string;
  contentType: string;
};

type ArchiveFinalize = CommonFinalize & {
  kind: "archive-photo";
  medium: "digital" | "film";
  locationName: string | null;
  selected: boolean;
};

type DailyFinalize = CommonFinalize & {
  kind: "daily-entry";
  title: string;
  reflection: string;
  entryDate: string;
  locationName: string | null;
  weather: string | null;
  heroApproved: boolean;
  pinnedHero: boolean;
  published: boolean;
  addToSelected: boolean;
  focalPointX: number;
  focalPointY: number;
};

type LibraryFinalize = CommonFinalize & {
  kind: "library-photo";
};

type FinalizeRequest = ArchiveFinalize | DailyFinalize | LibraryFinalize;
const allowedKinds = new Set(["archive-photo", "daily-entry", "library-photo"]);

function isFinalizeKind(value: unknown): value is FinalizeRequest["kind"] {
  return typeof value === "string" && allowedKinds.has(value);
}

async function cleanupOriginal(supabase: Awaited<ReturnType<typeof createClient>>, path: string) {
  await supabase.storage.from("originals").remove([path]);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = (await request.json()) as Partial<FinalizeRequest>;
  if (!isFinalizeKind(parsed.kind)) {
    return NextResponse.json({ error: "Unknown upload finalization kind." }, { status: 400 });
  }

  const body = parsed as FinalizeRequest;

  if (!body.path || !body.originalFilename || !body.contentType) {
    return NextResponse.json({ error: "Upload path, filename, and content type are required." }, { status: 400 });
  }

  if (body.kind === "daily-entry") {
    if (typeof body.published !== "boolean" || typeof body.addToSelected !== "boolean") {
      await cleanupOriginal(supabase, body.path);
      return NextResponse.json(
        { error: "Daily entry publish and Selected choices must be explicit." },
        { status: 400 },
      );
    }

    const { data: existingEntry } = await supabase
      .from("journal_entries")
      .select("id, entry_date, title")
      .eq("entry_date", body.entryDate)
      .maybeSingle();

    if (existingEntry) {
      await cleanupOriginal(supabase, body.path);
      return NextResponse.json(
        {
          error: `A journal entry already exists for ${body.entryDate}.`,
          existingEntry,
        },
        { status: 409 },
      );
    }
  }

  try {
    assertAcceptedImage(new File(["placeholder"], body.originalFilename, { type: body.contentType }));
  } catch (error) {
    await cleanupOriginal(supabase, body.path);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid image." },
      { status: 400 },
    );
  }

  let publicImagePath: string | null = null;
  let galleryImagePath: string | null = null;

  try {
    const buffer = await loadStoredOriginal(supabase, body.path, body.contentType);
    const fields = await buildPhotoFields(buffer, body.originalFilename);

    if (body.kind === "library-photo") {
      const { data, error } = await supabase
        .from("photos")
        .insert({
          image_path: body.path,
          image_width: fields.imageWidth,
          image_height: fields.imageHeight,
          original_filename: fields.originalFilename,
          date_taken: fields.metadata.dateTaken,
          camera: fields.metadata.camera,
          lens: fields.metadata.lens,
          aperture: fields.metadata.aperture,
          shutter_speed: fields.metadata.shutterSpeed,
          iso: fields.metadata.iso,
          latitude: fields.metadata.latitude,
          longitude: fields.metadata.longitude,
          focal_point_x: 0.5,
          focal_point_y: 0.5,
        })
        .select("id, image_path, original_filename, date_taken, camera, lens, aperture, shutter_speed, iso")
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ photo: data }, { status: 201 });
    }

    if (body.kind === "archive-photo") {
      const { data: existingPhoto } = await supabase
        .from("photos")
        .select("id")
        .eq("content_hash", fields.contentHash)
        .maybeSingle();
      if (existingPhoto) {
        await cleanupOriginal(supabase, body.path);
        return NextResponse.json({ photos: [], skippedDuplicates: [body.originalFilename], failedFiles: [] }, { status: 201 });
      }

      if (body.selected) {
        const derivatives = await buildPublicDerivatives(supabase, body.path, buffer);
        publicImagePath = derivatives.lightboxImagePath;
        galleryImagePath = derivatives.galleryImagePath;
      }

      const { data, error } = await supabase
        .from("photos")
        .insert({
          image_path: body.path,
          public_image_path: publicImagePath,
          gallery_image_path: galleryImagePath,
          image_width: fields.imageWidth,
          image_height: fields.imageHeight,
          original_filename: fields.originalFilename,
          content_hash: fields.contentHash,
          date_taken: fields.metadata.dateTaken,
          location_name: body.locationName,
          latitude: fields.metadata.latitude,
          longitude: fields.metadata.longitude,
          camera: fields.metadata.camera,
          lens: fields.metadata.lens,
          aperture: fields.metadata.aperture,
          shutter_speed: fields.metadata.shutterSpeed,
          iso: fields.metadata.iso,
          medium: body.medium,
          selected: body.selected,
          selected_size: body.selected ? "normal" : null,
          published: body.selected,
        })
        .select("id, original_filename, location_name, medium, selected, date_taken, camera")
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ photos: [data], skippedDuplicates: [], failedFiles: [] }, { status: 201 });
    }

    const derivatives = await buildPublicDerivatives(supabase, body.path, buffer);
    publicImagePath = derivatives.lightboxImagePath;
    galleryImagePath = derivatives.galleryImagePath;

    if (body.pinnedHero) {
      await supabase.from("photos").update({ pinned_hero: false }).eq("pinned_hero", true);
    }

    const { data: photo, error: photoError } = await supabase
      .from("photos")
      .insert({
        image_path: body.path,
        public_image_path: publicImagePath,
        gallery_image_path: galleryImagePath,
        image_width: fields.imageWidth,
        image_height: fields.imageHeight,
        original_filename: fields.originalFilename,
        date_taken: fields.metadata.dateTaken,
        location_name: body.locationName,
        latitude: fields.metadata.latitude,
        longitude: fields.metadata.longitude,
        camera: fields.metadata.camera,
        lens: fields.metadata.lens,
        aperture: fields.metadata.aperture,
        shutter_speed: fields.metadata.shutterSpeed,
        iso: fields.metadata.iso,
        hero_approved: body.heroApproved,
        pinned_hero: body.pinnedHero,
        focal_point_x: body.focalPointX,
        focal_point_y: body.focalPointY,
        selected: body.addToSelected,
        selected_size: body.addToSelected ? "normal" : null,
        selected_order: null,
        published: body.published,
      })
      .select("id")
      .single();
    if (photoError) throw new Error(photoError.message);

    const { data: entry, error: entryError } = await supabase
      .from("journal_entries")
      .insert({
        photo_id: photo.id,
        entry_date: body.entryDate,
        title: body.title,
        reflection: body.reflection,
        weather: body.weather,
        published: body.published,
      })
      .select("id, entry_date, title")
      .single();
    if (entryError) {
      await supabase.from("photos").delete().eq("id", photo.id);
      throw new Error(entryError.message);
    }

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    if (publicImagePath || galleryImagePath) {
      await supabase.storage
        .from("public-images")
        .remove([publicImagePath, galleryImagePath].filter(Boolean) as string[]);
    }
    await cleanupOriginal(supabase, body.path);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload finalization failed." },
      { status: 400 },
    );
  }
}
