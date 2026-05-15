import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPhotoVisualStyle } from "@/lib/public/visuals";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type PageProps = { params: Promise<{ date: string }> };

export default async function JournalEntryPage({ params }: PageProps) {
  const { date } = await params;
  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("journal_entries")
    .select("entry_date, title, reflection, weather, photos(id, location_name, aperture, shutter_speed, iso)")
    .eq("entry_date", date)
    .eq("published", true)
    .maybeSingle();
  if (!entry) notFound();
  const { data: neighbors } = await supabase
    .from("journal_entries")
    .select("entry_date")
    .eq("published", true)
    .order("entry_date", { ascending: true });
  const dates = ((neighbors ?? []) as Array<{ entry_date: string }>).map((item) => item.entry_date);
  const index = dates.indexOf(entry.entry_date);
  const previous = dates[index - 1];
  const next = dates[index + 1];

  return (
    <>
      <SiteHeader />
      <main className={`${styles.page} shell`}>
        <div className={styles.image} style={{ background: getPhotoVisualStyle(entry.photos?.id ?? entry.entry_date) }} />
        <article>
          <h1 className="display">{entry.title}</h1>
          <p>{entry.entry_date} · {entry.photos?.location_name ?? "Tokyo"}</p>
          <dl>
            <div><dt>Aperture</dt><dd>{entry.photos?.aperture ?? "—"}</dd></div>
            <div><dt>Shutter</dt><dd>{entry.photos?.shutter_speed ?? "—"}</dd></div>
            <div><dt>ISO</dt><dd>{entry.photos?.iso ?? "—"}</dd></div>
          </dl>
          <p className="serif">{entry.reflection}</p>
        </article>
        <nav>
          {previous ? <Link href={`/journal/${previous}`}>← Previous</Link> : <span />}
          {next ? <Link href={`/journal/${next}`}>Next →</Link> : null}
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
