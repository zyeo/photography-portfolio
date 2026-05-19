import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type RouteContext = { params: Promise<{ id: string }> };
type CollectionUpdate = Database["public"]["Tables"]["collections"]["Update"];

const updateCollectionSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required.").max(240, "Title is too long.").optional(),
    slug: z.string().trim().min(1, "Slug is required.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers, and hyphens.").optional(),
    description: z.string().trim().nullable().optional(),
    type: z.enum(["medium", "project", "theme"]).optional(),
    published: z.boolean().optional(),
    display_order: z.number().int().nullable().optional(),
    cover_photo_id: z.string().uuid().nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = updateCollectionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { id } = await context.params;
  if (parsed.data.cover_photo_id) {
    const { data: membership } = await supabase
      .from("photo_collections")
      .select("photo_id")
      .eq("collection_id", id)
      .eq("photo_id", parsed.data.cover_photo_id)
      .maybeSingle();
    if (!membership) return NextResponse.json({ error: "Cover photo must belong to this collection." }, { status: 400 });
  }

  const update: CollectionUpdate = {
    ...parsed.data,
    description: parsed.data.description === "" ? null : parsed.data.description,
  };
  const { data, error } = await supabase.from("collections").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ collection: data });
}
