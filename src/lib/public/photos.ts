import { createClient } from "@/lib/supabase/server";

export async function getHomepageData() {
  const supabase = await createClient();
  const [{ data: heroPhotos }, { data: entries }] = await Promise.all([
    supabase
      .from("photos")
      .select("id, original_filename, gallery_image_path, location_name, pinned_hero")
      .eq("published", true)
      .eq("hero_approved", true)
      .not("gallery_image_path", "is", null)
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

  return {
    heroPhotos: (heroPhotos ?? []) as Array<{
      id: string;
      original_filename: string;
      gallery_image_path: string | null;
      location_name: string | null;
      pinned_hero: boolean;
    }>,
    entries: (entries ?? []) as Array<{
      entry_date: string;
      title: string;
      photos: { location_name: string | null } | null;
    }>,
  };
}
