import { NextResponse } from "next/server";
import { uploadPublicImageDerivatives } from "@/lib/photos/public-images";
import { createClient } from "@/lib/supabase/server";
import { assertValidOriginalImage } from "@/lib/photos/validation";
import type { Database } from "@/types/database";

type RouteContext = { params: Promise<{ id: string }> };
type PhotoUpdate = Database["public"]["Tables"]["photos"]["Update"];

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = (await request.json()) as Partial<PhotoUpdate>;
  const update: PhotoUpdate = {
    location_name: body.location_name,
    date_taken: body.date_taken,
    medium: body.medium,
    hero_approved: body.hero_approved,
    selected: body.selected,
    selected_size: body.selected_size,
    selected_order: body.selected_order,
    published: body.published,
    focal_point_x: body.focal_point_x,
    focal_point_y: body.focal_point_y,
  };

  if (body.published === false) {
    const { data: publishedJournalEntry } = await supabase
      .from("journal_entries")
      .select("id")
      .eq("photo_id", id)
      .eq("published", true)
      .maybeSingle();

    if (publishedJournalEntry) {
      return NextResponse.json(
        { error: "This photo is used by a published journal entry. Unpublish the journal entry first." },
        { status: 409 },
      );
    }
  }

  if (body.published === true) {
    const { data: photo } = await supabase
      .from("photos")
      .select("image_path, public_image_path, gallery_image_path")
      .eq("id", id)
      .single();

    if (photo && (!photo.public_image_path || !photo.gallery_image_path)) {
      const { data: original, error: downloadError } = await supabase.storage
        .from("originals")
        .download(photo.image_path);

      if (downloadError || !original) {
        return NextResponse.json({ error: "Original image is unavailable for publishing." }, { status: 400 });
      }

      const originalBuffer = await original.arrayBuffer();
      try {
        await assertValidOriginalImage(originalBuffer, original.type);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Invalid image." },
          { status: 400 },
        );
      }

      const derivatives = await uploadPublicImageDerivatives(
        supabase,
        photo.image_path,
        originalBuffer,
      );
      update.public_image_path = derivatives.lightboxImagePath;
      update.gallery_image_path = derivatives.galleryImagePath;
    }
  }

  const { data, error } = await supabase.from("photos").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ photo: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const [{ data: photo }, { data: journalEntry }] = await Promise.all([
    supabase
      .from("photos")
      .select("id, image_path, gallery_image_path, public_image_path")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("journal_entries")
      .select("id, entry_date, title")
      .eq("photo_id", id)
      .maybeSingle(),
  ]);

  if (!photo) return NextResponse.json({ error: "Photo was not found." }, { status: 404 });
  if (journalEntry) {
    return NextResponse.json(
      {
        error: "This photo is linked to a journal entry. Manage or remove it from Journal Admin before deleting.",
        journalEntry,
      },
      { status: 409 },
    );
  }

  const [{ error: membershipError }, { error: coverError }] = await Promise.all([
    supabase.from("photo_collections").delete().eq("photo_id", id),
    supabase.from("collections").update({ cover_photo_id: null }).eq("cover_photo_id", id),
  ]);
  if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 400 });
  if (coverError) return NextResponse.json({ error: coverError.message }, { status: 400 });

  const { data: journalEntryBeforeDelete } = await supabase
    .from("journal_entries")
    .select("id, entry_date, title")
    .eq("photo_id", id)
    .maybeSingle();
  if (journalEntryBeforeDelete) {
    return NextResponse.json(
      {
        error: "This photo became linked to a journal entry before deletion. Manage or remove it from Journal Admin before deleting.",
        journalEntry: journalEntryBeforeDelete,
      },
      { status: 409 },
    );
  }

  const { error: deleteError } = await supabase.from("photos").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });

  const storageWarnings: string[] = [];
  const { error: originalDeleteError } = await supabase.storage.from("originals").remove([photo.image_path]);
  if (originalDeleteError) storageWarnings.push(`Original cleanup failed: ${originalDeleteError.message}`);

  const publicPaths = [photo.gallery_image_path, photo.public_image_path].filter(Boolean) as string[];
  if (publicPaths.length) {
    const { error: publicDeleteError } = await supabase.storage.from("public-images").remove(publicPaths);
    if (publicDeleteError) storageWarnings.push(`Public image cleanup failed: ${publicDeleteError.message}`);
  }

  return NextResponse.json({
    deletedPhotoId: photo.id,
    storageWarnings,
  });
}
