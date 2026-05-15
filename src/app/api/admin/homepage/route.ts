import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { photoId?: string | null };
  await supabase.from("photos").update({ pinned_hero: false }).eq("pinned_hero", true);
  if (body.photoId) {
    const { error } = await supabase.from("photos").update({ pinned_hero: true }).eq("id", body.photoId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
