import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPhotoVisualStyle, getPublicImageUrl } from "@/lib/public/visuals";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type JournalPageProps = { searchParams: Promise<{ page?: string }> };
const ARCHIVE_PAGE_SIZE = 24;

function getPageNumber(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 1 ? parsed : 1;
}

function getExcerpt(reflection: string) {
  return reflection.length > 150 ? `${reflection.slice(0, 147).trim()}...` : reflection;
}

export default async function JournalArchivePage({ searchParams }: JournalPageProps) {
  const params = await searchParams;
  const page = getPageNumber(params.page);
  const from = page === 1 ? 0 : 1 + (page - 1) * ARCHIVE_PAGE_SIZE;
  const to = page === 1 ? ARCHIVE_PAGE_SIZE : from + ARCHIVE_PAGE_SIZE - 1;
  const supabase = await createClient();
  const { data: entries, count } = await supabase
    .from("journal_entries")
    .select("entry_date, title, reflection, photos(id, gallery_image_path, image_width, image_height, location_name)", { count: "exact" })
    .eq("published", true)
    .order("entry_date", { ascending: false })
    .range(from, to);
  const journalEntries = (entries ?? []) as Array<{
    entry_date: string;
    title: string;
    reflection: string;
    photos: { id: string; gallery_image_path: string | null; image_width: number | null; image_height: number | null; location_name: string | null } | null;
  }>;
  const latest = page === 1 ? journalEntries[0] : null;
  const latestImageUrl = getPublicImageUrl(latest?.photos?.gallery_image_path ?? null);
  const archiveEntries = page === 1 ? journalEntries.slice(1) : journalEntries;
  const hasOlder = typeof count === "number" && to + 1 < count;
  const hasNewer = page > 1;

  return (
    <>
      <SiteHeader />
      <main className={`${styles.page} shell`}>
        <h1 className="display">Journal Archive</h1>
        <p className="page-kicker">A journal of photographs, places, and the practice of noticing.</p>
        {latest ? (
          <article className={styles.featured}>
            <figure>
              {latestImageUrl ? (
                <img
                  src={latestImageUrl}
                  alt=""
                  width={latest.photos?.image_width ?? undefined}
                  height={latest.photos?.image_height ?? undefined}
                />
              ) : (
                <span aria-hidden="true" style={{ background: getPhotoVisualStyle(latest.photos?.id ?? latest.entry_date) }} />
              )}
            </figure>
            <section>
              <span>{latest.entry_date}</span>
              <h2 className="display">{latest.title}</h2>
              <p className="serif">{latest.reflection}</p>
              <Link className="utility-link" href={`/journal/${latest.entry_date}`}>Read entry</Link>
            </section>
          </article>
        ) : null}
        {archiveEntries.length ? (
          <ol className={styles.archive}>
            {archiveEntries.map((entry) => {
              const thumbnailUrl = getPublicImageUrl(entry.photos?.gallery_image_path ?? null);

              return (
                <li key={entry.entry_date}>
                  <Link href={`/journal/${entry.entry_date}`} aria-label={`Read ${entry.title}`}>
                    <figure>
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt=""
                          width={entry.photos?.image_width ?? undefined}
                          height={entry.photos?.image_height ?? undefined}
                          loading="lazy"
                        />
                      ) : (
                        <span aria-hidden="true" style={{ background: getPhotoVisualStyle(entry.photos?.id ?? entry.entry_date) }} />
                      )}
                    </figure>
                    <section>
                      <span>{entry.entry_date}</span>
                      <strong className="serif">{entry.title}</strong>
                      <em>{entry.photos?.location_name ?? "Tokyo"}</em>
                      <p>{getExcerpt(entry.reflection)}</p>
                    </section>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : null}
        {!latest && !archiveEntries.length ? (
          <p className={`${styles.empty} serif`}>The journal is quiet for now. Daily entries will appear here once published.</p>
        ) : null}
        {hasNewer || hasOlder ? (
          <nav className={styles.pagination} aria-label="Journal archive pagination">
            {hasNewer ? <Link href={page === 2 ? "/journal/archive" : `/journal/archive?page=${page - 1}`}>← Newer entries</Link> : <span />}
            {hasOlder ? <Link href={`/journal/archive?page=${page + 1}`}>Older entries →</Link> : null}
          </nav>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
