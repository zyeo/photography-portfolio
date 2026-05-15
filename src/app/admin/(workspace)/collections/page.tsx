import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function CollectionsPage() {
  const supabase = await createClient();
  const { data: collections } = await supabase
    .from("collections")
    .select("id, title, slug, type, published, display_order")
    .order("display_order", { ascending: true, nullsFirst: false });

  return (
    <main className={styles.page}>
      <p className="eyebrow">Collections</p>
      <h1 className="display">Organize bodies of work</h1>
      <div className={styles.list}>
        {collections?.map((collection) => (
          <article key={collection.id}>
            <strong className="serif">{collection.title}</strong>
            <span>{collection.slug}</span>
            <span>{collection.type}</span>
            <span>{collection.published ? "Published" : "Draft"}</span>
          </article>
        ))}
      </div>
    </main>
  );
}
