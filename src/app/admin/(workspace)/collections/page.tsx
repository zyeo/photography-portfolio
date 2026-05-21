import { createClient } from "@/lib/supabase/server";
import { CollectionManager } from "./collection-manager";
import styles from "./page.module.css";

export default async function CollectionsPage() {
  const supabase = await createClient();
  const [{ data: collections }, { data: photos }, { data: memberships }] = await Promise.all([
    supabase
      .from("collections")
      .select("id, title, slug, description, type, published, display_order, cover_photo_id")
      .order("display_order", { ascending: true, nullsFirst: false }),
    supabase
      .from("photos")
      .select("id, original_filename, gallery_image_path, public_image_path, image_width, image_height, medium, date_taken, location_name, published")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("photo_collections")
      .select("collection_id, photo_id, display_order, photos(id, original_filename, gallery_image_path, public_image_path, image_width, image_height, medium, date_taken, location_name, published)")
      .order("display_order", { ascending: true, nullsFirst: false }),
  ]);

  return (
    <main className={styles.page}>
      <p className="eyebrow">Collections</p>
      <h1 className="display">Organize bodies of work</h1>
      <CollectionManager initialCollections={collections ?? []} photos={photos ?? []} memberships={memberships ?? []} />
    </main>
  );
}
