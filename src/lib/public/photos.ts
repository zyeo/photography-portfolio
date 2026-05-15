import { createClient } from "@/lib/supabase/server";

export async function getHomepageData() {
  const supabase = await createClient();
  const [{ data: heroPhotos }, { data: entries }] = await Promise.all([
    supabase
      .from("photos")
      .select("id, original_filename, public_image_path, location_name, pinned_hero")
      .eq("published", true)
      .eq("hero_approved", true)
      .order("pinned_hero", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("journal_entries")
      .select("entry_date, title, photos(location_name)")
      .eq("published", true)
      .order("entry_date", { ascending: false })
      .limit(3),
  ]);

  return { heroPhotos: heroPhotos ?? [], entries: entries ?? [] };
}
