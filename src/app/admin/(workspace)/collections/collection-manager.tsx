"use client";

import { useState, type FormEvent } from "react";
import { getPhotoVisualStyle, getPublicImageUrl } from "@/lib/public/visuals";
import styles from "./collection-manager.module.css";

type Collection = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: "medium" | "project" | "theme";
  published: boolean;
  display_order: number | null;
  cover_photo_id: string | null;
};

type Photo = {
  id: string;
  original_filename: string;
  gallery_image_path: string | null;
  public_image_path: string | null;
  image_width: number | null;
  image_height: number | null;
  medium: "digital" | "film";
  date_taken: string | null;
  location_name: string | null;
  published: boolean;
};

type Membership = {
  collection_id: string;
  photo_id: string;
  display_order: number | null;
  photos: Photo | null;
};

export function CollectionManager({
  initialCollections,
  photos,
  memberships: initialMemberships,
}: {
  initialCollections: Collection[];
  photos: Photo[];
  memberships: Membership[];
}) {
  const [collections, setCollections] = useState(initialCollections);
  const [memberships, setMemberships] = useState(initialMemberships);
  const [activeId, setActiveId] = useState<string | null>(initialCollections[0]?.id ?? null);
  const [editing, setEditing] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeCollection = collections.find((collection) => collection.id === activeId) ?? null;
  const activeMembers = memberships.filter((membership) => membership.collection_id === activeId && membership.photos);
  const activeCoverMember = activeMembers.find((membership) => membership.photo_id === activeCollection?.cover_photo_id);
  const activeCoverWarning = activeCollection?.cover_photo_id && !activeCoverMember
    ? "not an eligible collection member"
    : activeCoverMember?.photos
      ? getCoverIneligibilityReason(activeCoverMember.photos)
      : null;

  function getCoverIneligibilityReason(photo: Photo) {
    if (!photo.published) return "Draft photo";
    if (!photo.gallery_image_path && !photo.public_image_path) return "Missing public assets";
    if (!photo.gallery_image_path) return "Missing gallery derivative";
    if (!photo.public_image_path) return "Missing public derivative";
    return null;
  }

  async function createCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(formData.get("title") ?? "").trim(),
          slug: String(formData.get("slug") ?? "").trim(),
          type: String(formData.get("type") ?? "theme"),
          description: String(formData.get("description") ?? "").trim() || null,
        }),
      });
      const payload = (await response.json()) as { collection?: Collection; error?: string };
      if (!response.ok || !payload.collection) throw new Error(payload.error ?? "Could not create collection.");
      setCollections((current) => [...current, payload.collection!]);
      setActiveId(payload.collection.id);
      setStatus("Collection created.");
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create collection.");
    } finally {
      setPending(false);
    }
  }

  async function updateCollection(updates: Record<string, unknown>) {
    if (!activeId) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/collections/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const payload = (await response.json()) as { collection?: Collection; error?: string };
      if (!response.ok || !payload.collection) throw new Error(payload.error ?? "Could not update collection.");
      setCollections((current) => current.map((collection) => collection.id === activeId ? payload.collection! : collection));
      setStatus("Collection saved.");
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update collection.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function saveCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const saved = await updateCollection({
      title: String(formData.get("title") ?? "").trim(),
      slug: String(formData.get("slug") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      type: String(formData.get("type") ?? "theme"),
      published: formData.get("published") === "on",
      display_order: String(formData.get("display_order") ?? "").trim()
        ? Number(formData.get("display_order"))
        : null,
    });
    if (saved) setEditing(false);
  }

  async function assignPhoto(photoId: string) {
    if (!activeId) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/collections/${activeId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not add photo.");
      const photo = photos.find((candidate) => candidate.id === photoId) ?? null;
      setMemberships((current) =>
        current.some((membership) => membership.collection_id === activeId && membership.photo_id === photoId)
          ? current
          : [...current, { collection_id: activeId, photo_id: photoId, display_order: null, photos: photo }],
      );
      setStatus("Photo added to collection.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add photo.");
    } finally {
      setPending(false);
    }
  }

  async function removePhoto(photoId: string) {
    if (!activeId) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/collections/${activeId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      const payload = (await response.json()) as { clearedCover?: boolean; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not remove photo.");
      setMemberships((current) => current.filter((membership) => !(membership.collection_id === activeId && membership.photo_id === photoId)));
      if (payload.clearedCover) {
        setCollections((current) => current.map((collection) => collection.id === activeId ? { ...collection, cover_photo_id: null } : collection));
      }
      setStatus("Photo removed from collection.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove photo.");
    } finally {
      setPending(false);
    }
  }

  function toggleMemberChecked(photoId: string) {
    setSelectedMemberIds((current) =>
      current.includes(photoId) ? current.filter((id) => id !== photoId) : [...current, photoId],
    );
  }

  async function removeSelectedMembers() {
    if (!activeId || !selectedMemberIds.length) return;
    setPending(true);
    setError(null);
    try {
      const results = await Promise.allSettled(
        selectedMemberIds.map(async (photoId) => {
          const response = await fetch(`/api/admin/collections/${activeId}/photos`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoId }),
          });
          const payload = (await response.json()) as { clearedCover?: boolean; error?: string };
          if (!response.ok) throw new Error(payload.error ?? "Could not remove photo.");
          return { photoId, clearedCover: payload.clearedCover ?? false };
        }),
      );
      const removed = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
      const failed = results.filter((result) => result.status === "rejected").length;
      const removedIds = new Set(removed.map((item) => item.photoId));
      setMemberships((current) => current.filter((membership) => !(membership.collection_id === activeId && removedIds.has(membership.photo_id))));
      if (removed.some((item) => item.clearedCover)) {
        setCollections((current) => current.map((collection) => collection.id === activeId ? { ...collection, cover_photo_id: null } : collection));
      }
      setSelectedMemberIds((current) => current.filter((id) => !removedIds.has(id)));
      setStatus(`${removed.length} removed, ${failed} failed.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove selected photos.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.layout}>
      <section>
        {collections.map((collection) => (
          <button key={collection.id} onClick={() => setActiveId(collection.id)} data-active={collection.id === activeId}>
            <strong>{collection.title}</strong>
            <span>{collection.type} · {collection.published ? "published" : "draft"}</span>
          </button>
        ))}
      </section>
      <aside>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {status ? <p className={styles.status} role="status">{status}</p> : null}

        {activeCollection ? (
          <div className={styles.activeCollection}>
            <div>
              <p className="eyebrow">Active collection</p>
              <strong className="serif">{activeCollection.title}</strong>
              <button type="button" onClick={() => setEditing((current) => !current)}>
                {editing ? "Close edit" : "Edit collection"}
              </button>
            </div>
            {editing ? (
              <form onSubmit={saveCollection}>
                <label>Title<input name="title" defaultValue={activeCollection.title} required /></label>
                <label>Slug<input name="slug" defaultValue={activeCollection.slug} required /></label>
                <label>Description<textarea name="description" rows={3} defaultValue={activeCollection.description ?? ""} /></label>
                <label>Type<select name="type" defaultValue={activeCollection.type}><option value="medium">Medium</option><option value="project">Project</option><option value="theme">Theme</option></select></label>
                <label>Display order<input name="display_order" type="number" defaultValue={activeCollection.display_order ?? ""} /></label>
                <label className={styles.checkbox}><input name="published" type="checkbox" defaultChecked={activeCollection.published} /> Published</label>
                <button type="submit" disabled={pending}>Save collection</button>
              </form>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={createCollection}>
          <p className="eyebrow">Create collection</p>
          <label>Title<input name="title" required /></label>
          <label>Slug<input name="slug" required /></label>
          <label>Type<select name="type" defaultValue="theme"><option value="medium">Medium</option><option value="project">Project</option><option value="theme">Theme</option></select></label>
          <label>Description<textarea name="description" rows={3} /></label>
          <button type="submit" disabled={pending}>Create collection</button>
        </form>
      </aside>

      <div className={styles.members}>
        <p className="eyebrow">Current members</p>
        {selectedMemberIds.length ? (
          <div className={styles.memberBulkBar}>
            <strong>{selectedMemberIds.length} selected</strong>
            <button type="button" onClick={removeSelectedMembers} disabled={pending}>
              Remove selected from this collection
            </button>
          </div>
        ) : null}
        {activeCoverWarning ? (
          <p className={styles.warning} role="status">
            Current cover is ineligible: {activeCoverWarning}. Clear it or choose another eligible member.
          </p>
        ) : null}
        {activeMembers.length ? activeMembers.map((membership) => {
          const photo = membership.photos!;
          const thumbnailUrl = getPublicImageUrl(photo.gallery_image_path);
          const isCover = activeCollection?.cover_photo_id === photo.id;
          const coverIneligibilityReason = getCoverIneligibilityReason(photo);

          return (
            <article key={`${membership.collection_id}-${photo.id}`}>
              <label className={styles.memberSelector}>
                <input
                  type="checkbox"
                  checked={selectedMemberIds.includes(photo.id)}
                  onChange={() => toggleMemberChecked(photo.id)}
                />
                <span>Select member</span>
              </label>
              <div>
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="" width={photo.image_width ?? undefined} height={photo.image_height ?? undefined} loading="lazy" />
                ) : (
                  <span aria-hidden="true" style={{ background: getPhotoVisualStyle(photo.id) }} />
                )}
              </div>
              <section>
                <strong>{photo.original_filename}</strong>
                <span>{photo.medium} · {photo.date_taken?.slice(0, 10) ?? "Undated"} · {photo.location_name ?? "No location"}</span>
                {isCover ? <em>Current cover</em> : null}
                {coverIneligibilityReason ? (
                  <p className={styles.coverNote}>Cannot be cover: {coverIneligibilityReason}.</p>
                ) : null}
                <div>
                  <button type="button" onClick={() => updateCollection({ cover_photo_id: photo.id })} disabled={pending || isCover || Boolean(coverIneligibilityReason)}>
                    {isCover ? "Cover selected" : "Set as cover"}
                  </button>
                  <button type="button" onClick={() => removePhoto(photo.id)} disabled={pending}>Remove</button>
                </div>
              </section>
            </article>
          );
        }) : <p>No photos in this collection yet.</p>}
        {activeCollection?.cover_photo_id ? (
          <button type="button" onClick={() => updateCollection({ cover_photo_id: null })} disabled={pending}>Clear cover</button>
        ) : null}
      </div>

      <div className={styles.assignments}>
        <p className="eyebrow">Add recent photo</p>
        {photos.map((photo) => (
          <button key={photo.id} onClick={() => assignPhoto(photo.id)} disabled={pending}>{photo.original_filename}</button>
        ))}
      </div>
    </div>
  );
}
