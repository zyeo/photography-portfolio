import { createClient } from "@/lib/supabase/server";
import { SelectedCurator } from "./selected-curator";
import styles from "./page.module.css";

export default async function SelectedPage() {
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("photos")
    .select("id, original_filename, selected_size, selected_order")
    .eq("selected", true)
    .order("selected_order", { ascending: true, nullsFirst: false });

  return (
    <main className={styles.page}>
      <p className="eyebrow">Selected</p>
      <h1 className="display">Curate the gallery</h1>
      <SelectedCurator initialPhotos={photos ?? []} />
    </main>
  );
}
