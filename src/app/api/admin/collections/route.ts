import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    title?: string;
    slug?: string;
    type?: "medium" | "project" | "theme";
    description?: string;
  };
  const { data, error } = await supabase
    .from("collections")
    .insert({
      title: body.title ?? "Untitled",
      slug: body.slug ?? "untitled",
      type: body.type ?? "theme",
      description: body.description ?? null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ collection: data }, { status: 201 });
}
