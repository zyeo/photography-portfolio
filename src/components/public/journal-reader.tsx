"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContactIconLinks } from "@/components/contact-icon-links";
import { getPhotoVisualStyle, getPublicImageUrl } from "@/lib/public/visuals";
import type { JournalReaderEntry } from "@/lib/public/journal";
import styles from "./journal-reader.module.css";

type JournalReaderProps = {
  entry: JournalReaderEntry;
  older: JournalReaderEntry | null;
  newer: JournalReaderEntry | null;
  entries: JournalReaderEntry[];
};

type ImageTransition = {
  entry: JournalReaderEntry;
  direction: "earlier" | "later";
  id: number;
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
  onSelect,
}: {
  entry: JournalReaderEntry | null;
  direction: "older" | "newer";
  onSelect: (entry: JournalReaderEntry) => void;
}) {
  if (!entry) return <div className={styles.emptyGhost} aria-hidden="true" data-direction={direction} />;

  const imageUrl = getImageUrl(entry);
  const label = direction === "older" ? "Earlier entry" : "Later entry";

  return (
    <Link
      className={styles.ghost}
      href={getJournalHref(entry)}
      prefetch={false}
      data-direction={direction}
      aria-label={`${label}: ${entry.title}`}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
        event.preventDefault();
        onSelect(entry);
      }}
    >
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
      <span>{direction === "older" ? "Earlier" : "Later"}</span>
    </Link>
  );
}

export function JournalReader({ entry, older, newer, entries }: JournalReaderProps) {
  const router = useRouter();
  const cachedEntries = useMemo(() => {
    const entriesByDate = new Map<string, JournalReaderEntry>();
    [entry, older, newer, ...entries].forEach((cachedEntry) => {
      if (cachedEntry) entriesByDate.set(cachedEntry.entry_date, cachedEntry);
    });
    return [...entriesByDate.values()].sort((first, second) =>
      first.entry_date.localeCompare(second.entry_date),
    );
  }, [entries, entry, newer, older]);
  const [activeDate, setActiveDate] = useState(entry.entry_date);
  const [imageTransition, setImageTransition] = useState<ImageTransition | null>(null);
  const transitionIdRef = useRef(0);
  const activeIndex = Math.max(
    0,
    cachedEntries.findIndex((cachedEntry) => cachedEntry.entry_date === activeDate),
  );
  const activeEntry = cachedEntries[activeIndex] ?? entry;
  const activeOlder = activeIndex > 0 ? cachedEntries[activeIndex - 1] : null;
  const activeNewer = activeIndex < cachedEntries.length - 1 ? cachedEntries[activeIndex + 1] : null;
  const imageUrl = getImageUrl(activeEntry);
  const outgoingImageUrl = imageTransition ? getImageUrl(imageTransition.entry) : null;
  const nearbyEntries = cachedEntries.slice(
    Math.max(0, activeIndex - 3),
    Math.min(cachedEntries.length, activeIndex + 4),
  );
  const preloadUrls = [
    ...new Set(
      nearbyEntries
        .filter((nearbyEntry) => nearbyEntry.entry_date !== activeEntry.entry_date)
        .map((preloadEntry) => getImageUrl(preloadEntry))
        .filter((url): url is string => Boolean(url)),
    ),
  ];

  const selectEntry = useCallback((nextEntry: JournalReaderEntry) => {
    if (nextEntry.entry_date === activeEntry.entry_date) return;
    setImageTransition({
      entry: activeEntry,
      direction: nextEntry.entry_date < activeEntry.entry_date ? "earlier" : "later",
      id: ++transitionIdRef.current,
    });
    setActiveDate(nextEntry.entry_date);
    const href = getJournalHref(nextEntry);
    if (window.location.pathname !== href) window.history.pushState(null, "", href);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [activeEntry]);

  useEffect(() => {
    setImageTransition(null);
    setActiveDate(entry.entry_date);
  }, [entry.entry_date]);

  useEffect(() => {
    if (!imageTransition) return;
    const transitionId = imageTransition.id;
    const timeout = window.setTimeout(() => {
      setImageTransition((current) => current?.id === transitionId ? null : current);
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [imageTransition]);

  useEffect(() => {
    function handlePopState() {
      const dateFromPath = window.location.pathname.match(/^\/journal\/(\d{4}-\d{2}-\d{2})$/)?.[1];
      const nextDate = window.location.pathname === "/journal" ? entry.entry_date : dateFromPath;
      const cachedEntry = cachedEntries.find((candidate) => candidate.entry_date === nextDate);

      if (cachedEntry) {
        setImageTransition(null);
        setActiveDate(cachedEntry.entry_date);
        window.scrollTo({ top: 0, behavior: "auto" });
      } else if (nextDate) {
        router.refresh();
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [cachedEntries, entry.entry_date, router]);

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

      if (event.key === "ArrowLeft" && activeOlder) {
        event.preventDefault();
        selectEntry(activeOlder);
      }
      if (event.key === "ArrowRight" && activeNewer) {
        event.preventDefault();
        selectEntry(activeNewer);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeNewer, activeOlder, selectEntry]);

  return (
    <main className={styles.reader}>
      <div className={styles.stageWrap}>
        <NeighborFrame entry={activeOlder} direction="older" onSelect={selectEntry} />
        <figure className={styles.stage}>
          {imageTransition ? (
            <span
              key={`outgoing-${imageTransition.id}`}
              className={`${styles.stageVisual} ${outgoingImageUrl ? styles.stageImage : ""} ${
                imageTransition.direction === "later" ? styles.imageExitLater : styles.imageExitEarlier
              }`}
              aria-hidden="true"
              style={outgoingImageUrl
                ? { backgroundImage: `url(${outgoingImageUrl}), ${getPhotoVisualStyle(imageTransition.entry.photos?.id ?? imageTransition.entry.entry_date)}` }
                : { background: getPhotoVisualStyle(imageTransition.entry.photos?.id ?? imageTransition.entry.entry_date) }}
            />
          ) : null}
          {imageUrl ? (
            <span
              key={activeEntry.entry_date}
              className={`${styles.stageVisual} ${styles.stageImage} ${
                imageTransition
                  ? imageTransition.direction === "later"
                    ? styles.imageEnterLater
                    : styles.imageEnterEarlier
                  : ""
              }`}
              aria-hidden="true"
              style={{ backgroundImage: `url(${imageUrl}), ${getPhotoVisualStyle(activeEntry.photos?.id ?? activeEntry.entry_date)}` }}
            />
          ) : (
            <span
              key={activeEntry.entry_date}
              className={`${styles.stageVisual} ${
                imageTransition
                  ? imageTransition.direction === "later"
                    ? styles.imageEnterLater
                    : styles.imageEnterEarlier
                  : ""
              }`}
              aria-hidden="true"
              style={{ background: getPhotoVisualStyle(activeEntry.photos?.id ?? activeEntry.entry_date) }}
            />
          )}
        </figure>
        <NeighborFrame entry={activeNewer} direction="newer" onSelect={selectEntry} />
      </div>

      <article className={styles.caption}>
        <div className={styles.metadata}>
          <dl>
            <div><dt>Aperture</dt><dd>{activeEntry.photos?.aperture ?? "-"}</dd></div>
            <div><dt>Shutter</dt><dd>{activeEntry.photos?.shutter_speed ?? "-"}</dd></div>
            <div><dt>ISO</dt><dd>{activeEntry.photos?.iso ?? "-"}</dd></div>
          </dl>
          <p className={styles.date}>
            {activeEntry.entry_date} · {activeEntry.photos?.location_name ?? "Tokyo"}
            {activeEntry.weather ? ` · ${activeEntry.weather}` : ""}
          </p>
        </div>
        <h1 className="display">{activeEntry.title}</h1>
        <p className={`${styles.reflection} serif`}>{activeEntry.reflection}</p>
      </article>

      <nav className={styles.mobileNav} aria-label="Journal entry navigation">
        <span className={styles.navGroup} data-direction="earlier">
          {activeOlder ? (
            <>
              <Link
                href={getJournalHref(activeOlder)}
                prefetch={false}
                onClick={(event) => {
                  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                  event.preventDefault();
                  selectEntry(activeOlder);
                }}
              >
                Earlier
              </Link>
              <span className={styles.navSeparator} aria-hidden="true">•</span>
            </>
          ) : null}
        </span>
        <Link href="/journal/archive">Calendar</Link>
        <span className={styles.navGroup} data-direction="later">
          {activeNewer ? (
            <>
              <span className={styles.navSeparator} aria-hidden="true">•</span>
              <Link
                href={getJournalHref(activeNewer)}
                prefetch={false}
                onClick={(event) => {
                  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                  event.preventDefault();
                  selectEntry(activeNewer);
                }}
              >
                Later
              </Link>
            </>
          ) : null}
        </span>
      </nav>

      <footer className={styles.readerFooter}>
        <p>Made with ❤️ in Tokyo, Japan.</p>
        <ContactIconLinks className={styles.readerFooterLinks} />
      </footer>

      <div className={styles.preload} aria-hidden="true">
        {preloadUrls.map((url) => (
          <img key={url} src={url} alt="" loading="eager" />
        ))}
      </div>
    </main>
  );
}
