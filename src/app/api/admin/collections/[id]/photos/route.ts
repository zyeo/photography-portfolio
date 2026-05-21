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
  const { photoId } = (await request.json()) as { photoId: string };
  const { error } = await supabase.from("photo_collections").upsert({ photo_id: photoId, collection_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const { photoId } = (await request.json()) as { photoId?: string };
  if (!photoId) return NextResponse.json({ error: "Photo id is required." }, { status: 400 });

  const { data: collection } = await supabase
    .from("collections")
    .select("cover_photo_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("photo_collections")
    .delete()
    .eq("photo_id", photoId)
    .eq("collection_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (collection?.cover_photo_id === photoId) {
    const { error: coverError } = await supabase
      .from("collections")
      .update({ cover_photo_id: null })
      .eq("id", id);
    if (coverError) return NextResponse.json({ error: coverError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, clearedCover: collection?.cover_photo_id === photoId });
}
