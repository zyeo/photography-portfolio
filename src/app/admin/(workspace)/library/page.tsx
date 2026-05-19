import { createClient } from "@/lib/supabase/server";
import { LibraryGrid } from "./library-grid";
import styles from "./page.module.css";

type LibraryPageProps = { searchParams: Promise<{ q?: string; medium?: string; selected?: string }> };

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("photos")
    .select(
      "id, image_path, original_filename, public_image_path, gallery_image_path, image_width, image_height, location_name, medium, selected, hero_approved, pinned_hero, published, date_taken",
    )
    .order("created_at", { ascending: false });
  if (params.q) query = query.ilike("original_filename", `%${params.q}%`);
  if (params.medium) query = query.eq("medium", params.medium as "digital" | "film");
  if (params.selected === "true") query = query.eq("selected", true);
  const { data: photos } = await query;
  const photoIds = photos?.map((photo) => photo.id) ?? [];
  const [{ data: memberships }, { data: collections }, { data: journalEntries }] = await Promise.all([
    photoIds.length
      ? supabase.from("photo_collections").select("photo_id, collection_id").in("photo_id", photoIds)
      : Promise.resolve({ data: [] as Array<{ photo_id: string; collection_id: string }> }),
    supabase.from("collections").select("id, title, cover_photo_id"),
    photoIds.length
      ? supabase.from("journal_entries").select("photo_id, entry_date, title").in("photo_id", photoIds)
      : Promise.resolve({ data: [] as Array<{ photo_id: string; entry_date: string; title: string }> }),
  ]);
  const collectionTitleById = new Map((collections ?? []).map((collection) => [collection.id, collection.title]));
  const collectionNamesByPhotoId = new Map<string, string[]>();
  const coverCollectionNamesByPhotoId = new Map<string, string[]>();
  const journalEntryByPhotoId = new Map((journalEntries ?? []).map((entry) => [entry.photo_id, entry]));

  for (const membership of memberships ?? []) {
    const title = collectionTitleById.get(membership.collection_id);
    if (!title) continue;
    const names = collectionNamesByPhotoId.get(membership.photo_id) ?? [];
    names.push(title);
    collectionNamesByPhotoId.set(membership.photo_id, names);
  }

  for (const collection of collections ?? []) {
    if (!collection.cover_photo_id) continue;
    const names = coverCollectionNamesByPhotoId.get(collection.cover_photo_id) ?? [];
    names.push(collection.title);
    coverCollectionNamesByPhotoId.set(collection.cover_photo_id, names);
  }

  const libraryPhotos =
    photos?.map((photo) => ({
      ...photo,
      collectionNames: collectionNamesByPhotoId.get(photo.id) ?? [],
      coverCollectionNames: coverCollectionNamesByPhotoId.get(photo.id) ?? [],
      journalEntry: journalEntryByPhotoId.get(photo.id) ?? null,
    })) ?? [];

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
      <LibraryGrid
        initialPhotos={libraryPhotos}
        collections={(collections ?? []).map((collection) => ({ id: collection.id, title: collection.title }))}
      />
    </main>
  );
}
