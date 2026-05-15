import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function CollectionsPage() {
  const supabase = await createClient();
  const { data: collections } = await supabase
    .from("collections")
    .select("id, title, slug, description, cover_photo_id")
    .eq("published", true)
    .order("display_order", { ascending: true, nullsFirst: false });

  return (
    <>
      <SiteHeader section="Collections" />
      <main className={`${styles.page} shell`}>
        <p className="eyebrow">Collections</p>
        <h1 className="display">Ways through the archive.</h1>
        <div>
          {collections?.map((collection) => (
            <article key={collection.id}>
              <div aria-hidden="true" />
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
