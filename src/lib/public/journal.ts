import { createClient } from "@/lib/supabase/server";

const JOURNAL_ENTRY_SELECT =
  "entry_date, title, reflection, weather, photos(id, public_image_path, gallery_image_path, image_width, image_height, location_name, aperture, shutter_speed, iso)";

export type JournalReaderEntry = {
  entry_date: string;
  title: string;
  reflection: string;
  weather: string | null;
  photos: {
    id: string;
    public_image_path: string | null;
    gallery_image_path: string | null;
    image_width: number | null;
    image_height: number | null;
    location_name: string | null;
    aperture: string | null;
    shutter_speed: string | null;
    iso: number | null;
  } | null;
};

export type JournalReaderData = {
  entry: JournalReaderEntry | null;
  older: JournalReaderEntry | null;
  newer: JournalReaderEntry | null;
};

async function getOlderNeighbor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entryDate: string,
) {
  const { data } = await supabase
    .from("journal_entries")
    .select(JOURNAL_ENTRY_SELECT)
    .eq("published", true)
    .lt("entry_date", entryDate)
    .order("entry_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data ?? null) as JournalReaderEntry | null;
}

async function getNewerNeighbor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entryDate: string,
) {
  const { data } = await supabase
    .from("journal_entries")
    .select(JOURNAL_ENTRY_SELECT)
    .eq("published", true)
    .gt("entry_date", entryDate)
    .order("entry_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data ?? null) as JournalReaderEntry | null;
}

export async function getJournalReaderData(entryDate?: string): Promise<JournalReaderData> {
  const supabase = await createClient();
  const { data } = entryDate
    ? await supabase
        .from("journal_entries")
        .select(JOURNAL_ENTRY_SELECT)
        .eq("published", true)
        .eq("entry_date", entryDate)
        .maybeSingle()
    : await supabase
        .from("journal_entries")
        .select(JOURNAL_ENTRY_SELECT)
        .eq("published", true)
        .order("entry_date", { ascending: false })
        .limit(1)
        .maybeSingle();

  const entry = (data ?? null) as JournalReaderEntry | null;
  if (!entry) return { entry: null, older: null, newer: null };

  const [older, newer] = await Promise.all([
    getOlderNeighbor(supabase, entry.entry_date),
    getNewerNeighbor(supabase, entry.entry_date),
  ]);

  return { entry, older, newer };
}
