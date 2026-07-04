import { createClient } from "@/lib/supabase/server";
import { mergeSelectedLayoutItems } from "@/lib/selected-layout/layout.mjs";
import { SelectedCurator } from "./selected-curator";
import styles from "./page.module.css";

export default async function SelectedPage() {
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("photos")
    .select("id, original_filename, gallery_image_path, public_image_path, image_width, image_height, location_name, selected_size, selected_order, published")
    .eq("selected", true)
    .order("selected_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  const photoIds = photos?.map((photo) => photo.id) ?? [];
  const { data: layoutItems } = photoIds.length
    ? await supabase
        .from("selected_layout_items")
        .select("id, photo_id, desktop_x, desktop_y, desktop_width, desktop_z_index, mobile_order, caption")
        .in("photo_id", photoIds)
    : { data: [] };
  const layoutByPhotoId = new Map((layoutItems ?? []).map((item) => [item.photo_id, item]));
  const mergedLayoutByPhotoId = new Map(
    mergeSelectedLayoutItems(photos ?? [], layoutItems ?? []).map((item) => [item.photo_id, item]),
  );
  const selectedPhotos = (photos ?? []).map((photo) => {
    const layout = mergedLayoutByPhotoId.get(photo.id);

    return {
      ...photo,
      layout_id: layoutByPhotoId.get(photo.id)?.id ?? null,
      photo_id: photo.id,
      desktop_x: layout?.desktop_x ?? 0,
      desktop_y: layout?.desktop_y ?? 0,
      desktop_width: layout?.desktop_width ?? 28,
      desktop_z_index: layout?.desktop_z_index ?? 0,
      mobile_order: layout?.mobile_order ?? null,
      caption: layout?.caption ?? null,
    };
  });

  return (
    <main className={styles.page}>
      <p className="eyebrow">Selected</p>
      <h1 className="display">Curate the gallery</h1>
      <SelectedCurator initialPhotos={selectedPhotos} />
    </main>
  );
}
