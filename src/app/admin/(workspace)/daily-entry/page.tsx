import Link from "next/link";
import { getTokyoDateString } from "@/lib/admin/dates";
import { createClient } from "@/lib/supabase/server";
import { DailyEntryForm } from "./daily-entry-form";
import styles from "./page.module.css";

export default async function DailyEntryPage() {
  const today = getTokyoDateString();
  const supabase = await createClient();
  const { data: existingTodayEntry } = await supabase
    .from("journal_entries")
    .select("id, title, published")
    .eq("entry_date", today)
    .maybeSingle();

  return (
    <main className={styles.page}>
      <p className="eyebrow">Daily Entry</p>
      <h1 className="display">Publish today&apos;s photograph</h1>
      <p className="serif">
        One image, a little context, and only the metadata the photograph already knows.
      </p>
      {existingTodayEntry ? (
        <p className={styles.notice}>
          Today already has a {existingTodayEntry.published ? "published" : "draft"} journal entry, “{existingTodayEntry.title}”.{" "}
          <Link href="/admin/journal">Edit it in Journal</Link>.
        </p>
      ) : null}
      <DailyEntryForm today={today} />
    </main>
  );
}
