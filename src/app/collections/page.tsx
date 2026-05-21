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
        .select("id, gallery_image_path")
        .in("id", coverPhotoIds)
    : { data: [] as Array<{ id: string; gallery_image_path: string | null }> };
  const coverPhotoMap = new Map((coverPhotos ?? []).map((photo) => [photo.id, photo]));

  return (
    <>
      <SiteHeader />
      <main className={`${styles.page} shell`}>
        <p className="eyebrow">Collections</p>
        <h1 className="display">Ways through the archive.</h1>
        {collections?.length ? (
          <div className={styles.list}>
            {collections.map((collection) => (
            <article key={collection.id}>
              <div
                data-has-cover={Boolean(collection.cover_photo_id)}
                aria-hidden="true"
                style={getPhotoBackgroundStyle(
                  collection.cover_photo_id ?? collection.id,
                  collection.cover_photo_id
                    ? coverPhotoMap.get(collection.cover_photo_id)?.gallery_image_path ?? null
                    : null,
                )}
              />
              <section>
                <h2 className="display">{collection.title}</h2>
                {collection.description ? <p className="serif">{collection.description}</p> : null}
                <Link className="utility-link" href={`/collections/${collection.slug}`}>Open collection</Link>
              </section>
            </article>
            ))}
          </div>
        ) : (
          <p className={`${styles.empty} serif`}>Collections are being gathered. Check back as the archive takes shape.</p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
