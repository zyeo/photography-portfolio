import Link from "next/link";
import { ContactIconLinks } from "@/components/contact-icon-links";
import { SiteHeader } from "@/components/site-header";
import { getPhotoVisualStyle, getPublicImageUrl } from "@/lib/public/visuals";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type JournalArchiveProps = { searchParams: Promise<{ month?: string }> };

type CalendarEntry = {
  entry_date: string;
  title: string;
  photos: {
    id: string;
    gallery_image_path: string | null;
    location_name: string | null;
  } | null;
};
type CalendarCell =
  | { key: string; type: "blank" }
  | { key: string; type: "day"; day: number; date: string; entry: CalendarEntry | undefined };

const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});
const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function isValidMonth(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return false;
  const monthNumber = Number(value.slice(5, 7));
  return monthNumber >= 1 && monthNumber <= 12;
}

function clampMonth(month: string, firstMonth: string, lastMonth: string) {
  if (month < firstMonth) return firstMonth;
  if (month > lastMonth) return lastMonth;
  return month;
}

function getMonthStart(month: string) {
  return new Date(`${month}-01T00:00:00.000Z`);
}

function getMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function addMonths(date: Date, amount: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

function getDaysInMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

function getLeadingBlankCount(date: Date) {
  return (date.getUTCDay() + 6) % 7;
}

export default async function JournalArchivePage({ searchParams }: JournalArchiveProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: latestEntry }, { data: earliestEntry }] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("entry_date")
      .eq("published", true)
      .order("entry_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("journal_entries")
      .select("entry_date")
      .eq("published", true)
      .order("entry_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  const latestMonth = latestEntry?.entry_date?.slice(0, 7) ?? getMonthKey(new Date());
  const earliestMonth = earliestEntry?.entry_date?.slice(0, 7) ?? latestMonth;
  const month = clampMonth(isValidMonth(params.month) ? params.month! : latestMonth, earliestMonth, latestMonth);
  const monthStart = getMonthStart(month);
  const nextMonthStart = addMonths(monthStart, 1);
  const previousMonth = getMonthKey(addMonths(monthStart, -1));
  const nextMonth = getMonthKey(nextMonthStart);
  const hasPreviousMonth = month > earliestMonth;
  const hasNextMonth = month < latestMonth;
  const monthStartDate = `${month}-01`;
  const nextMonthStartDate = `${nextMonth}-01`;
  const daysInMonth = getDaysInMonth(monthStart);
  const leadingBlankCount = getLeadingBlankCount(monthStart);

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("entry_date, title, photos(id, gallery_image_path, location_name)")
    .eq("published", true)
    .gte("entry_date", monthStartDate)
    .lt("entry_date", nextMonthStartDate)
    .order("entry_date", { ascending: true });
  const entryByDate = new Map(
    ((entries ?? []) as CalendarEntry[]).map((entry) => [entry.entry_date, entry]),
  );
  const visibleDayCells = leadingBlankCount + daysInMonth;
  const trailingBlankCount = Math.max(0, 42 - visibleDayCells);
  const calendarCells: CalendarCell[] = [
    ...Array.from({ length: leadingBlankCount }, (_, index) => ({ key: `blank-${index}`, type: "blank" as const })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = `${month}-${String(day).padStart(2, "0")}`;
      return { key: date, type: "day" as const, day, date, entry: entryByDate.get(date) };
    }),
    ...Array.from({ length: trailingBlankCount }, (_, index) => ({ key: `blank-end-${index}`, type: "blank" as const })),
  ];

  return (
    <>
      <SiteHeader />
      <main className={`${styles.page} shell`}>
        <div className={styles.heading}>
          <div>
            <h1 className="display">Journal Archive</h1>
            <p className="page-kicker">A calendar of photographs, places, and the practice of noticing.</p>
          </div>
          <Link className="utility-link" href="/journal">Latest entry</Link>
        </div>

        <nav className={styles.monthNav} aria-label="Journal archive month navigation">
          {hasPreviousMonth ? (
            <Link href={`/journal/archive?month=${previousMonth}`}>Previous</Link>
          ) : (
            <span aria-disabled="true">Previous</span>
          )}
          <strong className="display">{monthFormatter.format(monthStart)}</strong>
          {hasNextMonth ? (
            <Link href={`/journal/archive?month=${nextMonth}`}>Next</Link>
          ) : (
            <span aria-disabled="true">Next</span>
          )}
        </nav>

        <div className={styles.weekdays} aria-hidden="true">
          {weekdayLabels.map((label) => <span key={label}>{label}</span>)}
        </div>

        <ol className={styles.calendar}>
          {calendarCells.map((cell) => {
            if (cell.type === "blank") return <li key={cell.key} aria-hidden="true" className={styles.blank} />;

            const entry = cell.entry;
            const imageUrl = getPublicImageUrl(entry?.photos?.gallery_image_path ?? null);

            return (
              <li key={cell.key} data-has-entry={Boolean(entry)}>
                {entry ? (
                  <Link href={`/journal/${entry.entry_date}`} aria-label={`Open ${entry.title}`}>
                    <span className={styles.day}>{cell.day}</span>
                    <figure>
                      {imageUrl ? (
                        <img src={imageUrl} alt="" loading="lazy" />
                      ) : (
                        <span aria-hidden="true" style={{ background: getPhotoVisualStyle(entry.photos?.id ?? entry.entry_date) }} />
                      )}
                    </figure>
                    <div>
                      <strong className="serif">{entry.title}</strong>
                      <em>{entry.photos?.location_name ?? "Tokyo"}</em>
                    </div>
                  </Link>
                ) : (
                  <span className={styles.day}>{cell.day}</span>
                )}
              </li>
            );
          })}
        </ol>

        {!entryByDate.size ? (
          <p className={`${styles.empty} serif`}>No entries for this month.</p>
        ) : null}

        <footer className={styles.archiveFooter}>
          <p>Made with ❤️ in Tokyo, Japan.</p>
          <ContactIconLinks className={styles.archiveFooterLinks} />
        </footer>
      </main>
    </>
  );
}
