import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = (await request.json()) as { photoIds?: string[] };
  const photoIds = [...new Set(body.photoIds ?? [])];
  if (!photoIds.length) return NextResponse.json({ error: "At least one photo is required." }, { status: 400 });

  const [{ data: collection }, { data: photos }, { data: existingMemberships }] = await Promise.all([
    supabase.from("collections").select("id, title").eq("id", id).maybeSingle(),
    supabase.from("photos").select("id").in("id", photoIds),
    supabase.from("photo_collections").select("photo_id").eq("collection_id", id).in("photo_id", photoIds),
  ]);

  if (!collection) return NextResponse.json({ error: "Collection was not found." }, { status: 404 });

  const existingIds = new Set((existingMemberships ?? []).map((membership) => membership.photo_id));
  const existingPhotoIds = new Set((photos ?? []).map((photo) => photo.id));
  const insertableIds = photoIds.filter((photoId) => existingPhotoIds.has(photoId) && !existingIds.has(photoId));
  const missingIds = photoIds.filter((photoId) => !existingPhotoIds.has(photoId));

  let failed = missingIds.length;
  if (insertableIds.length) {
    const { error } = await supabase
      .from("photo_collections")
      .insert(insertableIds.map((photoId) => ({ photo_id: photoId, collection_id: id })));
    if (error) {
      failed += insertableIds.length;
      return NextResponse.json(
        {
          error: error.message,
          added: 0,
          skippedAlreadyPresent: existingIds.size,
          failed,
          collection,
        },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({
    collection,
    added: insertableIds.length,
    skippedAlreadyPresent: existingIds.size,
    failed,
    addedPhotoIds: insertableIds,
  });
}
