import { createClient } from "@/lib/supabase/server";
import { JournalManager } from "./journal-manager";
import styles from "./page.module.css";

type JournalEntry = {
  id: string;
  entry_date: string;
  title: string;
  reflection: string;
  weather: string | null;
  published: boolean;
  photos: {
    id: string;
    original_filename: string;
    gallery_image_path: string | null;
    image_width: number | null;
    image_height: number | null;
  } | null;
};

type CandidatePhoto = {
  id: string;
  original_filename: string;
  gallery_image_path: string | null;
  public_image_path: string | null;
  image_width: number | null;
  image_height: number | null;
  date_taken: string | null;
  medium: "digital" | "film";
  location_name: string | null;
  selected: boolean;
  published: boolean;
};

export default async function JournalAdminPage() {
  const supabase = await createClient();
  const [{ data: entries }, { data: candidatePhotos }] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("id, entry_date, title, reflection, weather, published, photos(id, original_filename, gallery_image_path, image_width, image_height)")
      .order("entry_date", { ascending: false }),
    supabase
      .from("photos")
      .select("id, original_filename, gallery_image_path, public_image_path, image_width, image_height, date_taken, medium, location_name, selected, published")
      .eq("published", true)
      .not("gallery_image_path", "is", null)
      .not("public_image_path", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main className={styles.page}>
      <p className="eyebrow">Journal</p>
      <h1 className="display">Manage entries</h1>
      <JournalManager
        initialEntries={(entries ?? []) as JournalEntry[]}
        candidatePhotos={(candidatePhotos ?? []) as CandidatePhoto[]}
      />
    </main>
  );
}
