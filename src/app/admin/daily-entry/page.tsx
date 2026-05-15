import { getTokyoDateString } from "@/lib/admin/dates";
import { DailyEntryForm } from "./daily-entry-form";
import styles from "./page.module.css";

export default function DailyEntryPage() {
  const today = getTokyoDateString();

  return (
    <main className={styles.page}>
      <p className="eyebrow">Daily Entry</p>
      <h1 className="display">Publish today&apos;s photograph</h1>
      <p className="serif">
        One image, a little context, and only the metadata the photograph already knows.
      </p>
      <DailyEntryForm today={today} />
    </main>
  );
}
