import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { JournalReader } from "@/components/public/journal-reader";
import { getJournalReaderData } from "@/lib/public/journal";

type PageProps = { params: Promise<{ date: string }> };

export default async function JournalEntryPage({ params }: PageProps) {
  const { date } = await params;
  const { entry, older, newer } = await getJournalReaderData(date);

  if (!entry) notFound();

  return (
    <>
      <SiteHeader />
      <JournalReader entry={entry} older={older} newer={newer} />
      <SiteFooter />
    </>
  );
}
