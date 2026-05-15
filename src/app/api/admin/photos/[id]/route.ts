import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
    medium: body.medium,
    hero_approved: body.hero_approved,
    selected: body.selected,
    selected_size: body.selected_size,
    selected_order: body.selected_order,
    published: body.published,
    focal_point_x: body.focal_point_x,
    focal_point_y: body.focal_point_y,
  };

  const { data, error } = await supabase.from("photos").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ photo: data });
}
