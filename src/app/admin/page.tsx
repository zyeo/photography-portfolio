import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTokyoDateString } from "@/lib/admin/dates";
import styles from "./page.module.css";

export default async function AdminPage() {
  const supabase = await createClient();
  const today = getTokyoDateString();
  const [userResult, entryResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("journal_entries")
      .select("id, title, published")
      .eq("entry_date", today)
      .maybeSingle(),
  ]);

  const user = userResult.data.user;
  const entry = entryResult.data;

  return (
    <main className={styles.page}>
      <p className="eyebrow">Dashboard</p>
      <h1 className="display">Welcome back.</h1>
      <p className="serif">Signed in as {user?.email}</p>

      <article className={styles.statusCard}>
        <span>Today · {today}</span>
        <strong className="serif">
          {entry ? entry.title : "No journal entry yet"}
        </strong>
        <p>{entry?.published ? "Published" : entry ? "Draft" : "Ready when you are"}</p>
      </article>

      <Link className="utility-link" href="/admin/daily-entry">
        {entry ? "Review daily entry" : "Create daily entry"}
      </Link>
    </main>
  );
}
