"use client";

import { useState, type FormEvent } from "react";
import { getPhotoVisualStyle, getPublicImageUrl } from "@/lib/public/visuals";
import styles from "./page.module.css";

type LibraryPhoto = {
  id: string;
  image_path: string;
  original_filename: string;
  public_image_path: string | null;
  gallery_image_path: string | null;
  image_width: number | null;
  image_height: number | null;
  location_name: string | null;
  medium: "digital" | "film";
  selected: boolean;
  hero_approved: boolean;
  pinned_hero: boolean;
  published: boolean;
  date_taken: string | null;
  collectionNames: string[];
  coverCollectionNames: string[];
  journalEntry: { entry_date: string; title: string } | null;
};

type UpdatedPhoto = Partial<Omit<LibraryPhoto, "collectionNames" | "coverCollectionNames" | "journalEntry">> & { id: string };
type PatchResponse = { photo?: UpdatedPhoto; error?: string };
type CollectionOption = { id: string; title: string };

function formatDimensions(photo: LibraryPhoto) {
  return photo.image_width && photo.image_height ? `${photo.image_width} × ${photo.image_height}` : "Unknown dimensions";
}

function normalizePhoto(photo: LibraryPhoto): LibraryPhoto {
  return {
    ...photo,
    collectionNames: photo.collectionNames ?? [],
    coverCollectionNames: photo.coverCollectionNames ?? [],
    journalEntry: photo.journalEntry ?? null,
  };
}

export function LibraryGrid({
  initialPhotos,
  collections,
}: {
  initialPhotos: LibraryPhoto[];
  collections: CollectionOption[];
}) {
  const [photos, setPhotos] = useState(() => initialPhotos.map(normalizePhoto));
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dangerId, setDangerId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState("");
  const [bulkCollectionOpen, setBulkCollectionOpen] = useState(false);
  const [bulkCollectionId, setBulkCollectionId] = useState(collections[0]?.id ?? "");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function mergePhoto(photoId: string, updates: UpdatedPhoto) {
    setPhotos((current) =>
      current.map((photo) =>
        photo.id === photoId
          ? normalizePhoto({
              ...photo,
              ...updates,
              collectionNames: photo.collectionNames ?? [],
              coverCollectionNames: photo.coverCollectionNames ?? [],
              journalEntry: photo.journalEntry ?? null,
            })
          : photo,
      ),
    );
  }

  async function requestPhotoUpdate(photoId: string, updates: Record<string, unknown>) {
    const response = await fetch(`/api/admin/photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const payload = (await response.json()) as PatchResponse;

    if (!response.ok || !payload.photo) {
      throw new Error(payload.error ?? "Could not update photo.");
    }

    return payload.photo;
  }

  async function patchPhoto(photoId: string, updates: Record<string, unknown>) {
    setPendingId(photoId);
    setError(null);
    try {
      mergePhoto(photoId, await requestPhotoUpdate(photoId, updates));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update photo.");
    } finally {
      setPendingId(null);
    }
  }

  async function deletePhoto(photo: LibraryPhoto) {
    setPendingId(photo.id);
    setError(null);
    setStatus(null);
    try {
      const response = await fetch(`/api/admin/photos/${photo.id}`, { method: "DELETE" });
      const payload = (await response.json()) as {
        deletedPhotoId?: string;
        storageWarnings?: string[];
        error?: string;
      };

      if (!response.ok || !payload.deletedPhotoId) {
        throw new Error(payload.error ?? "Could not delete photo.");
      }

      setPhotos((current) => current.filter((currentPhoto) => currentPhoto.id !== photo.id));
      setSelectedIds((current) => current.filter((id) => id !== photo.id));
      setDangerId(null);
      setDeleteConfirmation("");
      setStatus(
        payload.storageWarnings?.length
          ? `Photo deleted, but cleanup needs attention: ${payload.storageWarnings.join(" ")}`
          : "Photo deleted. Database row and storage objects were removed.",
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete photo.");
    } finally {
      setPendingId(null);
    }
  }

  async function deleteSelectedPhotos(eligiblePhotos: LibraryPhoto[]) {
    if (!eligiblePhotos.length) return;

    setIsBulkPending(true);
    setError(null);
    setStatus(null);
    try {
      const results = await Promise.allSettled(
        eligiblePhotos.map(async (photo) => {
          const response = await fetch(`/api/admin/photos/${photo.id}`, { method: "DELETE" });
          const payload = (await response.json()) as {
            deletedPhotoId?: string;
            storageWarnings?: string[];
            error?: string;
          };

          if (!response.ok || !payload.deletedPhotoId) {
            throw new Error(`${photo.original_filename}: ${payload.error ?? "Could not delete photo."}`);
          }

          return {
            photo,
            deletedPhotoId: payload.deletedPhotoId,
            storageWarnings: payload.storageWarnings ?? [],
          };
        }),
      );
      const deleted = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
      const failed = results.flatMap((result) =>
        result.status === "rejected"
          ? [result.reason instanceof Error ? result.reason.message : "Unknown delete failure."]
          : [],
      );
      const deletedIds = new Set(deleted.map((result) => result.deletedPhotoId));
      const warnings = deleted.flatMap((result) =>
        result.storageWarnings.map((warning) => `${result.photo.original_filename}: ${warning}`),
      );

      setPhotos((current) => current.filter((photo) => !deletedIds.has(photo.id)));
      setSelectedIds((current) => current.filter((id) => !deletedIds.has(id)));
      setBulkDeleteOpen(false);
      setBulkDeleteConfirmation("");

      const pieces = [`${deleted.length} photo${deleted.length === 1 ? "" : "s"} deleted.`];
      if (failed.length) pieces.push(`${failed.length} failed: ${failed.join(" ")}`);
      if (warnings.length) pieces.push(`Cleanup warnings: ${warnings.join(" ")}`);
      setStatus(pieces.join(" "));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete selected photos.");
    } finally {
      setIsBulkPending(false);
    }
  }

  async function addSelectedToCollection() {
    if (!bulkCollectionId || !selectedIds.length) return;

    setIsBulkPending(true);
    setError(null);
    setStatus(null);
    try {
      const response = await fetch(`/api/admin/collections/${bulkCollectionId}/photos/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: selectedIds }),
      });
      const payload = (await response.json()) as {
        collection?: CollectionOption;
        added?: number;
        skippedAlreadyPresent?: number;
        failed?: number;
        addedPhotoIds?: string[];
        error?: string;
      };
      if (!response.ok || !payload.collection) throw new Error(payload.error ?? "Could not add selected photos to collection.");

      const addedIds = new Set(payload.addedPhotoIds ?? []);
      setPhotos((current) =>
        current.map((photo) =>
          addedIds.has(photo.id)
            ? {
                ...photo,
                collectionNames: photo.collectionNames.includes(payload.collection!.title)
                  ? photo.collectionNames
                  : [...photo.collectionNames, payload.collection!.title],
              }
            : photo,
        ),
      );
      setBulkCollectionOpen(false);
      setStatus(
        `${payload.added ?? 0} added, ${payload.skippedAlreadyPresent ?? 0} skipped already present, ${payload.failed ?? 0} failed.`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add selected photos to collection.");
    } finally {
      setIsBulkPending(false);
    }
  }

  async function saveMetadata(event: FormEvent<HTMLFormElement>, photo: LibraryPhoto) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const locationName = String(formData.get("location_name") ?? "").trim();
    const dateTaken = String(formData.get("date_taken") ?? "").trim();
    const medium = String(formData.get("medium") ?? photo.medium) as LibraryPhoto["medium"];

    setPendingId(photo.id);
    setSavedId(null);
    setError(null);
    try {
      mergePhoto(
        photo.id,
        await requestPhotoUpdate(photo.id, {
          location_name: locationName || null,
          date_taken: dateTaken ? `${dateTaken}T00:00:00.000Z` : null,
          medium,
        }),
      );
      setEditingId(null);
      setSavedId(photo.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save metadata.");
    } finally {
      setPendingId(null);
    }
  }

  async function toggleSelected(photo: LibraryPhoto) {
    await patchPhoto(
      photo.id,
      photo.selected
        ? { selected: false, selected_size: null, selected_order: null }
        : { selected: true, selected_size: "normal", selected_order: null },
    );
  }

  async function togglePinned(photo: LibraryPhoto) {
    setPendingId(photo.id);
    setError(null);
    try {
      const response = await fetch("/api/admin/homepage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: photo.pinned_hero ? null : photo.id }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not update pinned hero.");
      }

      setPhotos((current) =>
        current.map((currentPhoto) => ({
          ...currentPhoto,
          pinned_hero: photo.pinned_hero ? false : currentPhoto.id === photo.id,
        })),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update pinned hero.");
    } finally {
      setPendingId(null);
    }
  }

  async function toggleHeroApproval(photo: LibraryPhoto) {
    if (photo.hero_approved && photo.pinned_hero) {
      await togglePinned(photo);
    }

    await patchPhoto(photo.id, { hero_approved: !photo.hero_approved });
  }

  function toggleChecked(photoId: string) {
    setSelectedIds((current) =>
      current.includes(photoId) ? current.filter((id) => id !== photoId) : [...current, photoId],
    );
  }

  function clearChecked() {
    setSelectedIds([]);
  }

  async function unpinHero() {
    const response = await fetch("/api/admin/homepage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId: null }),
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Could not update pinned hero.");
    }

    setPhotos((current) => current.map((photo) => ({ ...photo, pinned_hero: false })));
  }

  async function runBulkAction(
    updatesForPhoto: (photo: LibraryPhoto) => Record<string, unknown>,
    options?: { unpinSelectedHero?: boolean },
  ) {
    const selectedPhotos = photos.filter((photo) => selectedIds.includes(photo.id));
    if (!selectedPhotos.length) return;

    setIsBulkPending(true);
    setError(null);
    try {
      if (options?.unpinSelectedHero && selectedPhotos.some((photo) => photo.pinned_hero)) {
        await unpinHero();
      }

      const results = await Promise.allSettled(
        selectedPhotos.map((photo) => requestPhotoUpdate(photo.id, updatesForPhoto(photo))),
      );
      const successfulPhotos = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
      const failedResults = results.filter((result) => result.status === "rejected");

      setPhotos((current) =>
        current.map((photo) => {
          const updates = successfulPhotos.find((updated) => updated.id === photo.id);

          return updates
            ? normalizePhoto({
                ...photo,
                ...updates,
                collectionNames: photo.collectionNames ?? [],
                coverCollectionNames: photo.coverCollectionNames ?? [],
                journalEntry: photo.journalEntry ?? null,
              })
            : photo;
        }),
      );

      if (failedResults.length) {
        const firstFailure = failedResults[0];
        throw firstFailure.status === "rejected" && firstFailure.reason instanceof Error
          ? firstFailure.reason
          : new Error(`${failedResults.length} photo updates failed.`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update selected photos.");
    } finally {
      setIsBulkPending(false);
    }
  }

  return (
    <>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {status ? <p className={styles.status} role="status">{status}</p> : null}
      {selectedIds.length ? (
        <section className={styles.bulkBar} aria-label="Bulk actions">
          <strong>{selectedIds.length} selected</strong>
          <div>
            <button
              type="button"
              onClick={() => runBulkAction(() => ({ selected: true, selected_size: "normal", selected_order: null }))}
              disabled={isBulkPending}
            >
              Add to Selected
            </button>
            <button
              type="button"
              onClick={() => runBulkAction(() => ({ selected: false, selected_size: null, selected_order: null }))}
              disabled={isBulkPending}
            >
              Remove from Selected
            </button>
            <button type="button" onClick={() => runBulkAction(() => ({ published: true }))} disabled={isBulkPending}>
              Publish
            </button>
            <button type="button" onClick={() => runBulkAction(() => ({ published: false }))} disabled={isBulkPending}>
              Unpublish
            </button>
            <button type="button" onClick={() => runBulkAction(() => ({ hero_approved: true }))} disabled={isBulkPending}>
              Approve Hero
            </button>
            <button
              type="button"
              onClick={() => runBulkAction(() => ({ hero_approved: false }), { unpinSelectedHero: true })}
              disabled={isBulkPending}
            >
              Remove Hero Approval
            </button>
            <button
              type="button"
              onClick={() => setBulkCollectionOpen((current) => !current)}
              disabled={isBulkPending || !collections.length}
            >
              Add to collection…
            </button>
            <button
              type="button"
              className={styles.bulkDangerAction}
              onClick={() => {
                setBulkDeleteOpen(true);
                setBulkDeleteConfirmation("");
              }}
              disabled={isBulkPending}
            >
              Delete selected…
            </button>
            <button type="button" onClick={clearChecked} disabled={isBulkPending}>
              Clear
            </button>
          </div>
        </section>
      ) : null}
      {bulkCollectionOpen ? (
        <section className={styles.bulkCollectionPanel} aria-label="Add selected photos to collection">
          <p className="eyebrow">Add to collection</p>
          <label>
            Collection
            <select value={bulkCollectionId} onChange={(event) => setBulkCollectionId(event.target.value)} disabled={isBulkPending}>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>{collection.title}</option>
              ))}
            </select>
          </label>
          <div>
            <button type="button" onClick={addSelectedToCollection} disabled={isBulkPending || !bulkCollectionId}>
              {isBulkPending ? "Adding…" : "Add selected"}
            </button>
            <button type="button" onClick={() => setBulkCollectionOpen(false)} disabled={isBulkPending}>
              Cancel
            </button>
          </div>
        </section>
      ) : null}
      {bulkDeleteOpen ? (() => {
        const selectedPhotos = photos.filter((photo) => selectedIds.includes(photo.id));
        const blockedPhotos = selectedPhotos.filter((photo) => photo.journalEntry);
        const eligiblePhotos = selectedPhotos.filter((photo) => !photo.journalEntry);
        const selectedStateCount = selectedPhotos.filter((photo) => photo.selected).length;
        const publishedCount = selectedPhotos.filter((photo) => photo.published).length;
        const heroApprovedCount = selectedPhotos.filter((photo) => photo.hero_approved).length;
        const pinnedCount = selectedPhotos.filter((photo) => photo.pinned_hero).length;
        const inCollectionsCount = selectedPhotos.filter((photo) => photo.collectionNames.length).length;
        const coverCount = selectedPhotos.filter((photo) => photo.coverCollectionNames.length).length;

        return (
          <section className={styles.bulkDangerPanel} aria-label="Bulk delete confirmation">
            <p className="eyebrow">Bulk hard delete</p>
            <dl>
              <div><dt>Total selected</dt><dd>{selectedPhotos.length}</dd></div>
              <div><dt>Eligible</dt><dd>{eligiblePhotos.length}</dd></div>
              <div><dt>Blocked</dt><dd>{blockedPhotos.length}</dd></div>
              <div><dt>Selected state</dt><dd>{selectedStateCount}</dd></div>
              <div><dt>Published</dt><dd>{publishedCount}</dd></div>
              <div><dt>Hero approved</dt><dd>{heroApprovedCount}</dd></div>
              <div><dt>Pinned hero</dt><dd>{pinnedCount}</dd></div>
              <div><dt>In collections</dt><dd>{inCollectionsCount}</dd></div>
              <div><dt>Collection covers</dt><dd>{coverCount}</dd></div>
            </dl>
            {blockedPhotos.length ? (
              <div className={styles.blockedList}>
                <p>Blocked because linked to journal entries:</p>
                <ul>
                  {blockedPhotos.map((photo) => (
                    <li key={photo.id}>
                      {photo.original_filename} · {photo.journalEntry?.entry_date} · {photo.journalEntry?.title}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p>
              Eligible photos will have their photo rows removed, collection links detached, collection cover references cleared, and original plus public derivatives deleted.
            </p>
            <label className={styles.deleteConfirm}>
              Type DELETE to confirm
              <input
                value={bulkDeleteConfirmation}
                onChange={(event) => setBulkDeleteConfirmation(event.target.value)}
                disabled={isBulkPending}
              />
            </label>
            <div>
              <button
                type="button"
                onClick={() => deleteSelectedPhotos(eligiblePhotos)}
                disabled={isBulkPending || bulkDeleteConfirmation !== "DELETE" || !eligiblePhotos.length}
              >
                {isBulkPending ? "Deleting…" : "Confirm delete selected"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkDeleteOpen(false);
                  setBulkDeleteConfirmation("");
                }}
                disabled={isBulkPending}
              >
                Cancel
              </button>
            </div>
          </section>
        );
      })() : null}
      <div className={styles.grid}>
        {photos.map((photo) => {
          const thumbnailUrl = getPublicImageUrl(photo.gallery_image_path);
          const isPending = pendingId === photo.id || isBulkPending;
          const collectionNames = photo.collectionNames ?? [];
          const coverCollectionNames = photo.coverCollectionNames ?? [];
          const warnings = [
            !photo.gallery_image_path ? "Missing gallery derivative" : null,
            !photo.public_image_path ? "Missing lightbox asset" : null,
          ].filter(Boolean);

          return (
            <article key={photo.id} className={styles.card}>
              <label className={styles.selector}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(photo.id)}
                  onChange={() => toggleChecked(photo.id)}
                  disabled={isBulkPending}
                />
                <span>Select photo</span>
              </label>
              <div className={styles.thumbnail}>
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt=""
                    width={photo.image_width ?? undefined}
                    height={photo.image_height ?? undefined}
                    loading="lazy"
                  />
                ) : (
                  <span aria-hidden="true" style={{ background: getPhotoVisualStyle(photo.id) }} />
                )}
              </div>

              <div className={styles.body}>
                <div className={styles.heading}>
                  <strong className="serif">{photo.original_filename}</strong>
                  <div className={styles.badges}>
                    <span data-tone={photo.selected ? "active" : "muted"}>{photo.selected ? "Selected" : "Not selected"}</span>
                    <span data-tone={photo.published ? "active" : "muted"}>{photo.published ? "Published" : "Draft"}</span>
                    <span data-tone={photo.hero_approved ? "active" : "muted"}>{photo.hero_approved ? "Hero approved" : "Not hero-approved"}</span>
                    {photo.pinned_hero ? <span data-tone="pin">Pinned hero</span> : null}
                    {photo.journalEntry ? <span data-tone="journal">Journal entry photo</span> : null}
                  </div>
                </div>

                <dl className={styles.meta}>
                  <div><dt>Medium</dt><dd>{photo.medium}</dd></div>
                  <div><dt>Date</dt><dd>{photo.date_taken?.slice(0, 10) ?? "Undated"}</dd></div>
                  <div><dt>Location</dt><dd>{photo.location_name ?? "No location"}</dd></div>
                  <div><dt>Dimensions</dt><dd>{formatDimensions(photo)}</dd></div>
                  <div>
                    <dt>Collections</dt>
                    <dd>{collectionNames.length ? collectionNames.join(", ") : "No collections"}</dd>
                  </div>
                </dl>

                {editingId === photo.id ? (
                  <form className={styles.editor} onSubmit={(event) => saveMetadata(event, photo)}>
                    <label>
                      Location
                      <input name="location_name" defaultValue={photo.location_name ?? ""} disabled={isPending} />
                    </label>
                    <label>
                      Date
                      <input
                        name="date_taken"
                        type="date"
                        defaultValue={photo.date_taken?.slice(0, 10) ?? ""}
                        disabled={isPending}
                      />
                    </label>
                    <label>
                      Medium
                      <select name="medium" defaultValue={photo.medium} disabled={isPending}>
                        <option value="digital">Digital</option>
                        <option value="film">Film</option>
                      </select>
                    </label>
                    <div>
                      <button type="submit" disabled={isPending}>Save metadata</button>
                      <button type="button" onClick={() => setEditingId(null)} disabled={isPending}>Cancel</button>
                    </div>
                  </form>
                ) : null}

                {savedId === photo.id ? <p className={styles.saved} role="status">Metadata saved.</p> : null}

                {warnings.length ? (
                  <p className={styles.warning}>{warnings.join(" · ")}</p>
                ) : null}

                {dangerId === photo.id ? (
                  <section className={styles.dangerPanel} aria-label="Delete dependency check">
                    <p className="eyebrow">Danger / dependency check</p>
                    <dl>
                      <div><dt>Published</dt><dd>{photo.published ? "Yes" : "No"}</dd></div>
                      <div><dt>Selected</dt><dd>{photo.selected ? "Yes" : "No"}</dd></div>
                      <div><dt>Hero approved</dt><dd>{photo.hero_approved ? "Yes" : "No"}</dd></div>
                      <div><dt>Pinned hero</dt><dd>{photo.pinned_hero ? "Yes" : "No"}</dd></div>
                      <div><dt>Collections</dt><dd>{collectionNames.length ? collectionNames.join(", ") : "None"}</dd></div>
                      <div><dt>Collection cover</dt><dd>{coverCollectionNames.length ? coverCollectionNames.join(", ") : "No"}</dd></div>
                      <div>
                        <dt>Journal entry</dt>
                        <dd>{photo.journalEntry ? `${photo.journalEntry.entry_date} · ${photo.journalEntry.title}` : "None"}</dd>
                      </div>
                      <div><dt>Original path</dt><dd>{photo.image_path}</dd></div>
                      <div><dt>Gallery path</dt><dd>{photo.gallery_image_path ?? "None"}</dd></div>
                      <div><dt>Lightbox path</dt><dd>{photo.public_image_path ?? "None"}</dd></div>
                    </dl>
                    {photo.journalEntry ? (
                      <p data-tone="blocked">
                        This photo is linked to a journal entry. Manage or remove it from the Journal editor before deleting.
                      </p>
                    ) : (
                      <>
                        <p>
                          Hard delete will remove this photo row, detach collection memberships, clear any collection cover use, and delete the original plus public derivatives.
                        </p>
                        <label className={styles.deleteConfirm}>
                          Type DELETE to confirm
                          <input
                            value={dangerId === photo.id ? deleteConfirmation : ""}
                            onChange={(event) => setDeleteConfirmation(event.target.value)}
                            disabled={isPending}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => deletePhoto(photo)}
                          disabled={isPending || deleteConfirmation !== "DELETE"}
                        >
                          {isPending ? "Deleting…" : "Confirm hard delete"}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setDangerId(null);
                        setDeleteConfirmation("");
                      }}
                    >
                      Close dependency check
                    </button>
                  </section>
                ) : null}

                <div className={styles.actions}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId((current) => (current === photo.id ? null : photo.id));
                      setSavedId(null);
                    }}
                    disabled={isPending}
                  >
                    {editingId === photo.id ? "Close edit" : "Edit metadata"}
                  </button>
                  <button type="button" onClick={() => toggleSelected(photo)} disabled={isPending}>
                    {photo.selected ? "Remove from Selected" : "Add to Selected"}
                  </button>
                  <button type="button" onClick={() => patchPhoto(photo.id, { published: !photo.published })} disabled={isPending}>
                    {photo.published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleHeroApproval(photo)}
                    disabled={isPending}
                  >
                    {photo.hero_approved ? "Remove hero approval" : "Approve for hero"}
                  </button>
                  <button
                    type="button"
                    className={styles.pinAction}
                    onClick={() => togglePinned(photo)}
                    disabled={isPending || (!photo.hero_approved && !photo.pinned_hero)}
                    title={!photo.hero_approved && !photo.pinned_hero ? "Approve for hero before pinning." : undefined}
                  >
                    {photo.pinned_hero ? "Unpin hero" : "Pin hero"}
                  </button>
                  <button
                    type="button"
                    className={styles.dangerAction}
                    onClick={() => {
                      setDangerId((current) => (current === photo.id ? null : photo.id));
                      setDeleteConfirmation("");
                    }}
                  >
                    {dangerId === photo.id ? "Close danger" : "Delete…"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
