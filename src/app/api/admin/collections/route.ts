import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createCollectionSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(240, "Title is too long."),
  slug: z.string().trim().min(1, "Slug is required.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers, and hyphens."),
  type: z.enum(["medium", "project", "theme"]),
  description: z.string().trim().nullable().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = createCollectionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { data, error } = await supabase
    .from("collections")
    .insert({
      title: parsed.data.title,
      slug: parsed.data.slug,
      type: parsed.data.type,
      description: parsed.data.description || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ collection: data }, { status: 201 });
}
