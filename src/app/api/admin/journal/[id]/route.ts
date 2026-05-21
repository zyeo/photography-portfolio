import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type RouteContext = { params: Promise<{ id: string }> };
type JournalUpdate = Database["public"]["Tables"]["journal_entries"]["Update"];

function isValidDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

const journalUpdateSchema = z
  .object({
    entry_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Entry date must use YYYY-MM-DD.")
      .refine(isValidDate, "Entry date is invalid.")
      .optional(),
    title: z.string().trim().min(1, "Title is required.").max(240, "Title is too long.").optional(),
    reflection: z.string().trim().min(1, "Reflection is required.").optional(),
    weather: z.string().trim().max(240, "Weather is too long.").nullable().optional(),
    published: z.boolean().optional(),
    photo_id: z.string().uuid("Replacement photo id is invalid.").optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let parsedJson: unknown;
  try {
    parsedJson = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = journalUpdateSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid journal update." }, { status: 400 });
  }

  const { id } = await context.params;

  if (parsed.data.published === true) {
    const { data: entryToPublish } = await supabase
      .from("journal_entries")
      .select("photo_id")
      .eq("id", id)
      .maybeSingle();
    const { data: linkedPhoto } = entryToPublish?.photo_id
      ? await supabase
          .from("photos")
          .select("published, gallery_image_path, public_image_path")
          .eq("id", entryToPublish.photo_id)
          .maybeSingle()
      : { data: null };

    if (!linkedPhoto?.published || !linkedPhoto.gallery_image_path || !linkedPhoto.public_image_path) {
      return NextResponse.json(
        { error: "Publish the linked photo before publishing this journal entry." },
        { status: 409 },
      );
    }
  }

  if (parsed.data.photo_id) {
    const [{ data: replacementPhoto }, { data: conflictingEntry }] = await Promise.all([
      supabase
        .from("photos")
        .select("id, published, gallery_image_path, public_image_path")
        .eq("id", parsed.data.photo_id)
        .maybeSingle(),
      supabase
        .from("journal_entries")
        .select("id")
        .eq("photo_id", parsed.data.photo_id)
        .neq("id", id)
        .maybeSingle(),
    ]);

    if (!replacementPhoto) {
      return NextResponse.json({ error: "Replacement photo was not found." }, { status: 400 });
    }
    if (!replacementPhoto.published || !replacementPhoto.gallery_image_path || !replacementPhoto.public_image_path) {
      return NextResponse.json(
        { error: "Replacement photo must be published and have usable public image assets." },
        { status: 400 },
      );
    }
    if (conflictingEntry) {
      return NextResponse.json({ error: "Replacement photo is already linked to another journal entry." }, { status: 409 });
    }
  }

  const update: JournalUpdate = {
    ...parsed.data,
    weather: parsed.data.weather === "" ? null : parsed.data.weather,
  };
  const { data, error } = await supabase
    .from("journal_entries")
    .update(update)
    .eq("id", id)
    .select("id, entry_date, title, reflection, weather, published, photos(id, original_filename, gallery_image_path, image_width, image_height)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ entry: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const { data, error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deletedEntryId: data.id });
}
