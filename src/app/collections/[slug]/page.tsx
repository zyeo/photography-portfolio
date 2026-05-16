import { notFound } from "next/navigation";
import { LightboxGallery } from "@/components/public/lightbox-gallery";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type PageProps = { params: Promise<{ slug: string }> };

export default async function CollectionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: collection } = await supabase
    .from("collections")
    .select("id, title, description")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (!collection) notFound();
  const { data: links } = await supabase
    .from("photo_collections")
    .select("display_order, photos(id, original_filename, public_image_path, location_name, date_taken)")
    .eq("collection_id", collection.id)
    .order("display_order", { ascending: true, nullsFirst: false });
  const photos = ((links ?? []) as Array<{ photos: { id: string; original_filename: string; public_image_path: string | null; location_name: string | null; date_taken: string | null } | null }>)
    .flatMap((link) => link.photos ? [link.photos] : []);

  return (
    <>
      <SiteHeader />
      <main className={`${styles.page} shell`}>
        <p className="eyebrow">Collection</p>
        <h1 className="display">{collection.title}</h1>
        <p className="serif">{collection.description}</p>
        <LightboxGallery photos={photos} />
      </main>
      <SiteFooter />
    </>
  );
}
