import { NextResponse } from "next/server";
import {
  mergeSelectedLayoutItems,
  normalizeSelectedLayoutItem,
  validateSelectedLayoutItems,
} from "@/lib/selected-layout/layout.mjs";
import { isMissingSelectedLayoutTableError } from "@/lib/selected-layout/errors";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type LayoutInsert = Database["public"]["Tables"]["selected_layout_items"]["Insert"];

async function requireUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function loadSelectedPhotos(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase
    .from("photos")
    .select("id, original_filename, gallery_image_path, public_image_path, image_width, image_height, location_name, selected_order, published")
    .eq("selected", true)
    .order("selected_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    if (isMissingSelectedLayoutTableError(error)) return [];
    throw new Error(error.message);
  }
  return data ?? [];
}

async function loadLayoutItems(supabase: Awaited<ReturnType<typeof createClient>>, photoIds: string[]) {
  if (!photoIds.length) return [];

  const { data, error } = await supabase
    .from("selected_layout_items")
    .select("id, photo_id, desktop_x, desktop_y, desktop_width, desktop_z_index, mobile_order, caption")
    .in("photo_id", photoIds);

  if (error) throw new Error(error.message);
  return data ?? [];
}

function toLayoutInsert(item: ReturnType<typeof normalizeSelectedLayoutItem>): LayoutInsert {
  return {
    photo_id: item.photo_id,
    desktop_x: item.desktop_x,
    desktop_y: item.desktop_y,
    desktop_width: item.desktop_width,
    desktop_z_index: item.desktop_z_index,
    mobile_order: item.mobile_order,
    caption: item.caption,
    updated_at: new Date().toISOString(),
  };
}

export async function GET() {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const photos = await loadSelectedPhotos(supabase);
    const layoutItems = await loadLayoutItems(supabase, photos.map((photo) => photo.id));
    const mergedItems = mergeSelectedLayoutItems(photos, layoutItems);
    const layoutByPhotoId = new Map(layoutItems.map((item) => [item.photo_id, item]));

    return NextResponse.json({
      items: photos.map((photo) => ({
        ...photo,
        layout_id: layoutByPhotoId.get(photo.id)?.id ?? null,
        ...mergedItems.find((item) => item.photo_id === photo.id),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load Selected layout." },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { items?: unknown };
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "Layout items are required." }, { status: 400 });
  }

  try {
    const photos = await loadSelectedPhotos(supabase);
    const selectedPhotoIds = new Set(photos.map((photo) => photo.id));
    const validation = validateSelectedLayoutItems(body.items, selectedPhotoIds);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.errors.join(" ") }, { status: 400 });
    }

    const fullLayout = mergeSelectedLayoutItems(
      photos,
      body.items.map((item) => normalizeSelectedLayoutItem(item as Parameters<typeof normalizeSelectedLayoutItem>[0])),
    );

    if (fullLayout.length) {
      const { error } = await supabase
        .from("selected_layout_items")
        .upsert(fullLayout.map(toLayoutInsert), { onConflict: "photo_id" });

      if (error) {
        if (isMissingSelectedLayoutTableError(error)) {
          return NextResponse.json(
            { error: "Run the selected_layout_items Supabase migration before saving this layout." },
            { status: 409 },
          );
        }

        throw new Error(error.message);
      }
    }

    const savedItems = await loadLayoutItems(supabase, photos.map((photo) => photo.id));
    const savedByPhotoId = new Map(savedItems.map((item) => [item.photo_id, item]));

    return NextResponse.json({
      items: photos.map((photo) => ({
        ...photo,
        layout_id: savedByPhotoId.get(photo.id)?.id ?? null,
        ...mergeSelectedLayoutItems(photos, savedItems).find((item) => item.photo_id === photo.id),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save Selected layout." },
      { status: 400 },
    );
  }
}
