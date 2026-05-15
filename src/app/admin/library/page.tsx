import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type LibraryPageProps = { searchParams: Promise<{ q?: string; medium?: string; selected?: string }> };

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("photos")
    .select("id, original_filename, location_name, medium, selected, hero_approved, date_taken")
    .order("created_at", { ascending: false });
  if (params.q) query = query.ilike("original_filename", `%${params.q}%`);
  if (params.medium) query = query.eq("medium", params.medium as "digital" | "film");
  if (params.selected === "true") query = query.eq("selected", true);
  const { data: photos } = await query;

  return (
    <main className={styles.page}>
      <p className="eyebrow">Library</p>
      <h1 className="display">All photographs</h1>
      <form>
        <input name="q" placeholder="Search filename" defaultValue={params.q} />
        <select name="medium" defaultValue={params.medium ?? ""}>
          <option value="">Any medium</option>
          <option value="digital">Digital</option>
          <option value="film">Film</option>
        </select>
        <label><input name="selected" type="checkbox" value="true" defaultChecked={params.selected === "true"} /> Selected only</label>
        <button type="submit">Filter</button>
      </form>
      <div className={styles.list}>
        {photos?.map((photo) => (
          <article key={photo.id}>
            <strong className="serif">{photo.original_filename}</strong>
            <span>{photo.location_name ?? "No location"}</span>
            <span>{photo.medium}</span>
            <span>{photo.selected ? "Selected" : "Not selected"}</span>
            <span>{photo.hero_approved ? "Hero approved" : "Not hero-approved"}</span>
          </article>
        ))}
      </div>
    </main>
  );
}
