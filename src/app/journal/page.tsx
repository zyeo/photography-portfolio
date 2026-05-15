import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPhotoVisualStyle } from "@/lib/public/visuals";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function JournalPage() {
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("journal_entries")
    .select("entry_date, title, reflection, photos(id, location_name)")
    .eq("published", true)
    .order("entry_date", { ascending: false });
  const journalEntries = (entries ?? []) as Array<{
    entry_date: string;
    title: string;
    reflection: string;
    photos: { id: string; location_name: string | null } | null;
  }>;
  const [latest, ...older] = journalEntries;

  return (
    <>
      <SiteHeader />
      <main className={`${styles.page} shell`}>
        <h1 className="display">Journal</h1>
        <p className="page-kicker">A journal of photographs, places, and the practice of noticing.</p>
        {latest ? (
          <article className={styles.featured}>
            <div style={{ background: getPhotoVisualStyle(latest.photos?.id ?? latest.entry_date) }} />
            <section>
              <span>{latest.entry_date}</span>
              <h2 className="display">{latest.title}</h2>
              <p className="serif">{latest.reflection}</p>
              <Link className="utility-link" href={`/journal/${latest.entry_date}`}>Read entry</Link>
            </section>
          </article>
        ) : null}
        <ol>
          {older.map((entry) => (
            <li key={entry.entry_date}>
              <span>{entry.entry_date}</span>
              <Link href={`/journal/${entry.entry_date}`} className="serif">{entry.title}</Link>
              <em>{entry.photos?.location_name ?? "Tokyo"}</em>
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter />
    </>
  );
}
