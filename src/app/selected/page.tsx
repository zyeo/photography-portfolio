import { LightboxGallery } from "@/components/public/lightbox-gallery";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function SelectedPage() {
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("photos")
    .select("id, original_filename, location_name, date_taken, selected_size")
    .eq("published", true)
    .eq("selected", true)
    .order("selected_order", { ascending: true, nullsFirst: false });

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
