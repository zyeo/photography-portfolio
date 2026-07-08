"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getPhotoVisualStyle, getPublicImageUrl } from "@/lib/public/visuals";
import type { JournalReaderEntry } from "@/lib/public/journal";
import styles from "./journal-reader.module.css";

type JournalReaderProps = {
  entry: JournalReaderEntry;
  older: JournalReaderEntry | null;
  newer: JournalReaderEntry | null;
  preloadEntries: JournalReaderEntry[];
};

function getImageUrl(entry: JournalReaderEntry) {
  return getPublicImageUrl(entry.photos?.public_image_path ?? entry.photos?.gallery_image_path ?? null);
}

function getJournalHref(entry: JournalReaderEntry) {
  return `/journal/${entry.entry_date}`;
}

function NeighborFrame({
  entry,
  direction,
}: {
  entry: JournalReaderEntry | null;
  direction: "older" | "newer";
}) {
  if (!entry) return <div className={styles.emptyGhost} aria-hidden="true" data-direction={direction} />;

  const imageUrl = getImageUrl(entry);
  const label = direction === "older" ? "Older entry" : "Newer entry";

  return (
    <Link className={styles.ghost} href={getJournalHref(entry)} data-direction={direction} aria-label={`${label}: ${entry.title}`}>
      <figure>
        {imageUrl ? (
          <span
            className={styles.ghostImage}
            aria-hidden="true"
            style={{ backgroundImage: `url(${imageUrl}), ${getPhotoVisualStyle(entry.photos?.id ?? entry.entry_date)}` }}
          />
        ) : (
          <span aria-hidden="true" style={{ background: getPhotoVisualStyle(entry.photos?.id ?? entry.entry_date) }} />
        )}
      </figure>
      <span>{direction === "older" ? "Older" : "Newer"}</span>
    </Link>
  );
}

export function JournalReader({ entry, older, newer, preloadEntries }: JournalReaderProps) {
  const router = useRouter();
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);
  const [canExpandReflection, setCanExpandReflection] = useState(false);
  const reflectionPreviewRef = useRef<HTMLParagraphElement>(null);
  const imageUrl = getImageUrl(entry);
  const reflectionId = `journal-reflection-${entry.entry_date}`;
  const preloadUrls = [
    ...new Set(
      preloadEntries
        .map((preloadEntry) => getImageUrl(preloadEntry))
        .filter((url): url is string => Boolean(url)),
    ),
  ];

  useEffect(() => {
    setIsReflectionOpen(false);
  }, [entry.entry_date]);

  useEffect(() => {
    function updateReflectionOverflow() {
      const element = reflectionPreviewRef.current;
      if (!element) return;
      setCanExpandReflection(element.scrollHeight > element.clientHeight + 1);
    }

    updateReflectionOverflow();
    window.addEventListener("resize", updateReflectionOverflow);
    return () => window.removeEventListener("resize", updateReflectionOverflow);
  }, [entry.reflection]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "ArrowLeft" && older) {
        event.preventDefault();
        router.push(getJournalHref(older));
      }
      if (event.key === "ArrowRight" && newer) {
        event.preventDefault();
        router.push(getJournalHref(newer));
      }
      if (event.key === "Escape" && isReflectionOpen) {
        event.preventDefault();
        setIsReflectionOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isReflectionOpen, older, newer, router]);

  return (
    <main className={styles.reader}>
      <div className={styles.stageWrap}>
        <NeighborFrame entry={older} direction="older" />
        <figure className={styles.stage}>
          {imageUrl ? (
            <span
              className={styles.stageImage}
              aria-hidden="true"
              style={{ backgroundImage: `url(${imageUrl}), ${getPhotoVisualStyle(entry.photos?.id ?? entry.entry_date)}` }}
            />
          ) : (
            <span aria-hidden="true" style={{ background: getPhotoVisualStyle(entry.photos?.id ?? entry.entry_date) }} />
          )}
        </figure>
        <NeighborFrame entry={newer} direction="newer" />
      </div>

      <article className={styles.caption}>
        <p className={styles.date}>
          {entry.entry_date} · {entry.photos?.location_name ?? "Tokyo"}
          {entry.weather ? ` · ${entry.weather}` : ""}
        </p>
        <h1 className="display">{entry.title}</h1>
        <p ref={reflectionPreviewRef} className={`${styles.reflection} serif`}>{entry.reflection}</p>
        <div className={styles.readMoreRow}>
          <button
            className={styles.readMore}
            type="button"
            aria-controls={reflectionId}
            aria-expanded={isReflectionOpen}
            aria-hidden={!canExpandReflection}
            disabled={!canExpandReflection}
            tabIndex={canExpandReflection ? undefined : -1}
            onClick={() => setIsReflectionOpen(true)}
          >
            Read more
          </button>
        </div>
        <dl>
          <div><dt>Aperture</dt><dd>{entry.photos?.aperture ?? "-"}</dd></div>
          <div><dt>Shutter</dt><dd>{entry.photos?.shutter_speed ?? "-"}</dd></div>
          <div><dt>ISO</dt><dd>{entry.photos?.iso ?? "-"}</dd></div>
        </dl>
      </article>

      <nav className={styles.mobileNav} aria-label="Journal entry navigation">
        {older ? <Link href={getJournalHref(older)}>Older</Link> : <span />}
        <Link href="/journal/archive">Archive</Link>
        {newer ? <Link href={getJournalHref(newer)}>Newer</Link> : <span />}
      </nav>
      <div className={styles.preload} aria-hidden="true">
        {preloadUrls.map((url) => (
          <img key={url} src={url} alt="" loading="eager" />
        ))}
      </div>
      {isReflectionOpen ? (
        <div className={styles.sheetLayer} role="presentation" onClick={() => setIsReflectionOpen(false)}>
          <section
            className={styles.sheet}
            id={reflectionId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${reflectionId}-title`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.sheetHeader}>
              <div>
                <p className={styles.date}>
                  {entry.entry_date} · {entry.photos?.location_name ?? "Tokyo"}
                  {entry.weather ? ` · ${entry.weather}` : ""}
                </p>
                <h2 className="display" id={`${reflectionId}-title`}>{entry.title}</h2>
              </div>
              <button type="button" onClick={() => setIsReflectionOpen(false)}>Close</button>
            </div>
            <p className={`${styles.sheetReflection} serif`}>{entry.reflection}</p>
          </section>
        </div>
      ) : null}
    </main>
  );
}
