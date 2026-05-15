import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const allowed = ["location_name", "medium", "hero_approved", "selected", "selected_size", "selected_order", "published"];
  const update = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
  const { data, error } = await supabase.from("photos").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ photo: data });
}
