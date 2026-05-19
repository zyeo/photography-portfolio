import { LightboxGallery } from "@/components/public/lightbox-gallery";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function SelectedPage() {
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("photos")
    .select("id, original_filename, public_image_path, gallery_image_path, image_width, image_height, location_name, date_taken, selected_size")
    .eq("published", true)
    .eq("selected", true)
    .not("gallery_image_path", "is", null)
    .order("selected_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  return (
    <>
      <SiteHeader />
      <main className={`${styles.page} shell`}>
        <h1 className="display">Selected</h1>
        <p className="page-kicker">A selection of photographs from recent years.</p>
        <LightboxGallery photos={photos ?? []} />
      </main>
      <SiteFooter />
    </>
  );
}
