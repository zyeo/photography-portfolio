import { createClient } from "@/lib/supabase/server";

export function getPhotoVisualStyle(seed: string) {
  const palettes = [
    "linear-gradient(135deg, #4d443a, #8c7960)",
    "linear-gradient(135deg, #24313a, #7b8b8f)",
    "linear-gradient(135deg, #5b4b41, #c2aa84)",
    "linear-gradient(135deg, #2e2a28, #776b61)",
  ];
  const index = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}

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
