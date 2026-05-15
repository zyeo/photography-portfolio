import { createClient } from "@/lib/supabase/server";
import { CollectionManager } from "./collection-manager";
import styles from "./page.module.css";

export default async function CollectionsPage() {
  const supabase = await createClient();
  const [{ data: collections }, { data: photos }] = await Promise.all([
    supabase.from("collections").select("id, title, slug, type, published, display_order").order("display_order", { ascending: true, nullsFirst: false }),
    supabase.from("photos").select("id, original_filename").order("created_at", { ascending: false }).limit(20),
  ]);

  return (
    <main className={styles.page}>
      <p className="eyebrow">Collections</p>
      <h1 className="display">Organize bodies of work</h1>
      <CollectionManager initialCollections={collections ?? []} photos={photos ?? []} />
    </main>
  );
}
