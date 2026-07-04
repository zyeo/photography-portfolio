import { SelectedLayoutGallery } from "@/components/public/selected-layout-gallery";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { mergeSelectedLayoutItems } from "@/lib/selected-layout/layout.mjs";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function SelectedPage() {
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("photos")
    .select("id, original_filename, public_image_path, gallery_image_path, image_width, image_height, location_name, date_taken, selected_size, selected_order")
    .eq("published", true)
    .eq("selected", true)
    .not("gallery_image_path", "is", null)
    .order("selected_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  const photoIds = photos?.map((photo) => photo.id) ?? [];
  const { data: layoutItems } = photoIds.length
    ? await supabase
        .from("selected_layout_items")
        .select("photo_id, desktop_x, desktop_y, desktop_width, desktop_z_index, mobile_order, caption")
        .in("photo_id", photoIds)
    : { data: [] };

  const mergedLayoutItems = mergeSelectedLayoutItems(photos ?? [], layoutItems ?? []);
  const layoutByPhotoId = new Map(mergedLayoutItems.map((item) => [item.photo_id, item]));
  const selectedPhotos = (photos ?? [])
    .map((photo) => ({
      ...photo,
      layout: layoutByPhotoId.get(photo.id) ?? null,
    }))
    .sort((a, b) => (a.layout?.mobile_order ?? 999) - (b.layout?.mobile_order ?? 999));

  return (
    <>
      <SiteHeader />
      <main className={`${styles.page} shell`}>
        <h1 className="display">Selected</h1>
        <p className="page-kicker">A selection of photographs from recent years.</p>
        {selectedPhotos.length ? (
          <SelectedLayoutGallery photos={selectedPhotos} />
        ) : (
          <p className={`${styles.empty} serif`}>A smaller edit is taking shape. Selected photographs will appear here soon.</p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
