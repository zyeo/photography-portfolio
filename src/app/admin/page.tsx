import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className={styles.page}>
      <p className="eyebrow">Dashboard</p>
      <h1 className="display">Welcome back.</h1>
      <p className="serif">Signed in as {user?.email}</p>
      <Link className="utility-link" href="/admin/photos/new">
        Upload photograph
      </Link>
    </main>
  );
}
