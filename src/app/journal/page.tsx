import { SiteHeader } from "@/components/site-header";
import { JournalReader } from "@/components/public/journal-reader";
import { getJournalReaderData } from "@/lib/public/journal";
import styles from "./page.module.css";

export default async function JournalPage() {
  const { entry, older, newer, preloadEntries } = await getJournalReaderData();

  return (
    <>
      <SiteHeader />
      {entry ? (
        <JournalReader entry={entry} older={older} newer={newer} preloadEntries={preloadEntries} />
      ) : (
        <main className={`${styles.emptyPage} shell`}>
          <h1 className="display">Journal</h1>
          <p className={`${styles.empty} serif`}>The journal is quiet for now. Daily entries will appear here once published.</p>
        </main>
      )}
    </>
  );
}
