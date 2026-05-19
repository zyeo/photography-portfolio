import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function isValidDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const entryDate =
    parsed && typeof parsed === "object" && "entryDate" in parsed && typeof parsed.entryDate === "string"
      ? parsed.entryDate
      : "";

  if (!isValidDate(entryDate)) {
    return NextResponse.json({ error: "Entry date is invalid." }, { status: 400 });
  }

  const { data: existingEntry } = await supabase
    .from("journal_entries")
    .select("id, entry_date, title")
    .eq("entry_date", entryDate)
    .maybeSingle();

  return NextResponse.json({ available: !existingEntry, existingEntry });
}
