import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPhotoVisualStyle, getPublicImageUrl } from "@/lib/public/visuals";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type PageProps = { params: Promise<{ date: string }> };

function getOrientation(width: number | null, height: number | null) {
  if (!width || !height) return "unknown";
  if (height > width * 1.08) return "portrait";
  if (width > height * 1.08) return "landscape";
  return "square";
}

export default async function JournalEntryPage({ params }: PageProps) {
  const { date } = await params;
  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("journal_entries")
    .select("entry_date, title, reflection, weather, photos(id, public_image_path, gallery_image_path, image_width, image_height, location_name, aperture, shutter_speed, iso)")
    .eq("entry_date", date)
    .eq("published", true)
    .maybeSingle();
  if (!entry) notFound();
  const journalEntry = entry as {
    entry_date: string;
    title: string;
    reflection: string;
    weather: string | null;
    photos: {
      id: string;
      public_image_path: string | null;
      gallery_image_path: string | null;
      image_width: number | null;
      image_height: number | null;
      location_name: string | null;
      aperture: string | null;
      shutter_speed: string | null;
      iso: number | null;
    } | null;
  };
  const imagePath = journalEntry.photos?.public_image_path ?? journalEntry.photos?.gallery_image_path ?? null;
  const imageUrl = getPublicImageUrl(imagePath);
  const orientation = getOrientation(journalEntry.photos?.image_width ?? null, journalEntry.photos?.image_height ?? null);
  const { data: neighbors } = await supabase
    .from("journal_entries")
    .select("entry_date")
    .eq("published", true)
    .order("entry_date", { ascending: true });
  const dates = ((neighbors ?? []) as Array<{ entry_date: string }>).map((item) => item.entry_date);
  const index = dates.indexOf(journalEntry.entry_date);
  const previous = dates[index - 1];
  const next = dates[index + 1];

  return (
    <>
      <SiteHeader />
      <main className={`${styles.page} shell`} data-orientation={orientation}>
        <figure className={styles.image}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              width={journalEntry.photos?.image_width ?? undefined}
              height={journalEntry.photos?.image_height ?? undefined}
            />
          ) : (
            <span aria-hidden="true" style={{ background: getPhotoVisualStyle(journalEntry.photos?.id ?? journalEntry.entry_date) }} />
          )}
        </figure>
        <article>
          <h1 className="display">{journalEntry.title}</h1>
          <p>
            {journalEntry.entry_date} · {journalEntry.photos?.location_name ?? "Tokyo"}
            {journalEntry.weather ? ` · ${journalEntry.weather}` : ""}
          </p>
          <dl>
            <div><dt>Aperture</dt><dd>{journalEntry.photos?.aperture ?? "—"}</dd></div>
            <div><dt>Shutter</dt><dd>{journalEntry.photos?.shutter_speed ?? "—"}</dd></div>
            <div><dt>ISO</dt><dd>{journalEntry.photos?.iso ?? "—"}</dd></div>
          </dl>
          <p className="serif">{journalEntry.reflection}</p>
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
