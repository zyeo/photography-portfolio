import { createClient } from "@/lib/supabase/server";
import { HeroManager } from "./hero-manager";
import styles from "./page.module.css";

export default async function HomepageAdminPage() {
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("photos")
    .select("id, original_filename, pinned_hero, focal_point_x, focal_point_y")
    .eq("hero_approved", true)
    .order("created_at", { ascending: false });

  return (
    <main className={styles.page}>
      <p className="eyebrow">Homepage</p>
      <h1 className="display">Hero rotation</h1>
      <HeroManager initialPhotos={photos ?? []} />
    </main>
  );
}
