import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPhotoBackgroundStyle } from "@/lib/public/visuals";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function CollectionsPage() {
  const supabase = await createClient();
  const { data: collections } = await supabase
    .from("collections")
    .select("id, title, slug, description, cover_photo_id")
    .eq("published", true)
    .order("display_order", { ascending: true, nullsFirst: false });
  const coverPhotoIds = (collections ?? [])
    .map((collection) => collection.cover_photo_id)
    .filter((id): id is string => Boolean(id));
  const { data: coverPhotos } = coverPhotoIds.length
    ? await supabase
        .from("photos")
        .select("id, public_image_path")
        .in("id", coverPhotoIds)
    : { data: [] as Array<{ id: string; public_image_path: string | null }> };
  const coverPhotoMap = new Map((coverPhotos ?? []).map((photo) => [photo.id, photo]));

  return (
    <>
      <SiteHeader />
      <main className={`${styles.page} shell`}>
        <p className="eyebrow">Collections</p>
        <h1 className="display">Ways through the archive.</h1>
        <div>
          {collections?.map((collection) => (
            <article key={collection.id}>
              <div
                aria-hidden="true"
                style={getPhotoBackgroundStyle(
                  collection.cover_photo_id ?? collection.id,
                  collection.cover_photo_id
                    ? coverPhotoMap.get(collection.cover_photo_id)?.public_image_path ?? null
                    : null,
                )}
              />
              <h2 className="display">{collection.title}</h2>
              <p className="serif">{collection.description}</p>
              <Link className="utility-link" href={`/collections/${collection.slug}`}>Open collection</Link>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
