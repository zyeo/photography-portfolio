"use client";

import { useState, type FormEvent } from "react";
import { getPhotoVisualStyle, getPublicImageUrl } from "@/lib/public/visuals";
import styles from "./page.module.css";

type JournalEntry = {
  id: string;
  entry_date: string;
  title: string;
  reflection: string;
  weather: string | null;
  published: boolean;
  photos: {
    id: string;
    original_filename: string;
    gallery_image_path: string | null;
    image_width: number | null;
    image_height: number | null;
  } | null;
};

type CandidatePhoto = {
  id: string;
  original_filename: string;
  gallery_image_path: string | null;
  public_image_path: string | null;
  image_width: number | null;
  image_height: number | null;
  date_taken: string | null;
  medium: "digital" | "film";
  location_name: string | null;
  selected: boolean;
  published: boolean;
};

type PatchResponse = { entry?: JournalEntry; error?: string };

export function JournalManager({
  initialEntries,
  candidatePhotos,
}: {
  initialEntries: JournalEntry[];
  candidatePhotos: CandidatePhoto[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [changingImageId, setChangingImageId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateEntry(entryId: string, updates: Record<string, unknown>) {
    setPendingId(entryId);
    setSavedId(null);
    setStatus(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin/journal/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const payload = (await response.json()) as PatchResponse;

      if (!response.ok || !payload.entry) {
        throw new Error(payload.error ?? "Could not update journal entry.");
      }

      setEntries((current) =>
        current
          .map((entry) => (entry.id === entryId ? payload.entry! : entry))
          .sort((a, b) => b.entry_date.localeCompare(a.entry_date)),
      );
      setSavedId(entryId);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update journal entry.");
      return false;
    } finally {
      setPendingId(null);
    }
  }

  async function deleteEntry(entryId: string) {
    setPendingId(entryId);
    setSavedId(null);
    setStatus(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin/journal/${entryId}`, { method: "DELETE" });
      const payload = (await response.json()) as { deletedEntryId?: string; error?: string };

      if (!response.ok || !payload.deletedEntryId) {
        throw new Error(payload.error ?? "Could not delete journal entry.");
      }

      setEntries((current) => current.filter((entry) => entry.id !== entryId));
      setDeletingId(null);
      setStatus("Journal entry deleted. The linked photo remains in the Library.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete journal entry.");
    } finally {
      setPendingId(null);
    }
  }

  async function saveEntry(event: FormEvent<HTMLFormElement>, entry: JournalEntry) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const saved = await updateEntry(entry.id, {
      title: String(formData.get("title") ?? "").trim(),
      reflection: String(formData.get("reflection") ?? "").trim(),
      weather: String(formData.get("weather") ?? "").trim() || null,
      entry_date: String(formData.get("entry_date") ?? "").trim(),
      published: formData.get("published") === "on",
    });

    if (saved) setEditingId(null);
  }

  async function changeImage(entryId: string, photoId: string) {
    const saved = await updateEntry(entryId, { photo_id: photoId });
    if (saved) {
      setChangingImageId(null);
      setStatus("Journal image changed. The old photo remains in the Library.");
    }
  }

  return (
    <>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {status ? <p className={styles.status} role="status">{status}</p> : null}
      <div className={styles.list}>
        {entries.map((entry) => {
          const isPending = pendingId === entry.id;
          const photoUrl = getPublicImageUrl(entry.photos?.gallery_image_path ?? null);
          const usedPhotoIds = new Set(entries.map((item) => item.photos?.id).filter(Boolean));
          const availablePhotos = candidatePhotos.filter(
            (photo) => photo.id === entry.photos?.id || !usedPhotoIds.has(photo.id),
          );

          return (
            <article key={entry.id}>
              <div className={styles.thumbnail}>
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt=""
                    width={entry.photos?.image_width ?? undefined}
                    height={entry.photos?.image_height ?? undefined}
                    loading="lazy"
                  />
                ) : (
                  <span aria-hidden="true" style={{ background: getPhotoVisualStyle(entry.photos?.id ?? entry.id) }} />
                )}
              </div>
              <div className={styles.body}>
                <div className={styles.heading}>
                  <div>
                    <strong className="serif">{entry.title}</strong>
                    <span>{entry.entry_date}</span>
                  </div>
                  <span data-state={entry.published ? "published" : "draft"}>
                    {entry.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p>{entry.weather ?? "No weather"}</p>
                <small>{entry.photos?.original_filename ?? "No linked photo"}</small>

                {editingId === entry.id ? (
                  <form onSubmit={(event) => saveEntry(event, entry)}>
                    <label>
                      Date
                      <input name="entry_date" type="date" defaultValue={entry.entry_date} required disabled={isPending} />
                    </label>
                    <label>
                      Title
                      <input name="title" defaultValue={entry.title} required disabled={isPending} />
                    </label>
                    <label>
                      Reflection
                      <textarea name="reflection" rows={5} defaultValue={entry.reflection} required disabled={isPending} />
                    </label>
                    <label>
                      Weather
                      <input name="weather" defaultValue={entry.weather ?? ""} disabled={isPending} />
                    </label>
                    <label className={styles.checkbox}>
                      <input name="published" type="checkbox" defaultChecked={entry.published} disabled={isPending} />
                      Published
                    </label>
                    <div>
                      <button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save entry"}</button>
                      <button type="button" onClick={() => setEditingId(null)} disabled={isPending}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className={styles.actions}>
                    <button type="button" onClick={() => setEditingId(entry.id)} disabled={isPending}>
                      Edit entry
                    </button>
                    <button
                      type="button"
                      onClick={() => updateEntry(entry.id, { published: !entry.published })}
                      disabled={isPending}
                    >
                      {entry.published ? "Unpublish" : "Publish"}
                    </button>
                    <button type="button" onClick={() => setChangingImageId(entry.id)} disabled={isPending}>
                      Change image…
                    </button>
                    <button type="button" className={styles.dangerAction} onClick={() => setDeletingId(entry.id)} disabled={isPending}>
                      Delete entry…
                    </button>
                  </div>
                )}

                {changingImageId === entry.id ? (
                  <section className={styles.imagePanel} aria-label="Change journal image">
                    <p className="eyebrow">Change image</p>
                    <p>Current image: {entry.photos?.original_filename ?? "No linked photo"}</p>
                    <div className={styles.candidateGrid}>
                      {availablePhotos.map((photo) => {
                        const candidateUrl = getPublicImageUrl(photo.gallery_image_path);
                        const isCurrent = photo.id === entry.photos?.id;

                        return (
                          <button
                            key={photo.id}
                            type="button"
                            data-current={isCurrent}
                            onClick={() => changeImage(entry.id, photo.id)}
                            disabled={isPending || isCurrent}
                          >
                            {candidateUrl ? (
                              <img
                                src={candidateUrl}
                                alt=""
                                width={photo.image_width ?? undefined}
                                height={photo.image_height ?? undefined}
                                loading="lazy"
                              />
                            ) : (
                              <span aria-hidden="true" style={{ background: getPhotoVisualStyle(photo.id) }} />
                            )}
                            <strong>{photo.original_filename}</strong>
                            <small>
                              {photo.date_taken?.slice(0, 10) ?? "Undated"} · {photo.medium} · {photo.location_name ?? "No location"}
                            </small>
                            <em>{photo.selected ? "Selected" : "Not selected"} · {photo.published ? "Published" : "Draft"}</em>
                          </button>
                        );
                      })}
                    </div>
                    {!availablePhotos.length ? <p>No eligible replacement photos available.</p> : null}
                    <button type="button" onClick={() => setChangingImageId(null)} disabled={isPending}>
                      Close image picker
                    </button>
                  </section>
                ) : null}

                {deletingId === entry.id ? (
                  <section className={styles.dangerPanel} aria-label="Delete journal entry confirmation">
                    <p className="eyebrow">Delete journal entry</p>
                    <p>This deletes only the journal entry.</p>
                    <p>The linked photo will remain in the Library.</p>
                    <p>The photo row, original file, and public image derivatives will not be deleted.</p>
                    <div>
                      <button type="button" onClick={() => deleteEntry(entry.id)} disabled={isPending}>
                        {isPending ? "Deleting…" : "Confirm delete entry"}
                      </button>
                      <button type="button" onClick={() => setDeletingId(null)} disabled={isPending}>
                        Cancel
                      </button>
                    </div>
                  </section>
                ) : null}

                {savedId === entry.id ? <p className={styles.saved} role="status">Entry saved.</p> : null}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
