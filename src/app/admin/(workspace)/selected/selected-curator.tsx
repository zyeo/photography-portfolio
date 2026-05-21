"use client";

import { useMemo, useState } from "react";
import { getPhotoVisualStyle, getPublicImageUrl } from "@/lib/public/visuals";
import styles from "./selected-curator.module.css";

type Photo = {
  id: string;
  original_filename: string;
  gallery_image_path: string | null;
  public_image_path: string | null;
  image_width: number | null;
  image_height: number | null;
  location_name: string | null;
  selected_size: "normal" | "large" | null;
  selected_order: number | null;
  published: boolean;
};

export function SelectedCurator({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const orderedPhotos = useMemo(
    () => [...photos].sort((a, b) => (a.selected_order ?? 999) - (b.selected_order ?? 999)),
    [photos],
  );

  async function patchPhoto(photoId: string, body: Record<string, unknown>) {
    const response = await fetch(`/api/admin/photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Could not update selected photo.");
  }

  async function persist(nextPhotos: Photo[], successMessage: string) {
    setPending(true);
    setError(null);
    setStatus(null);
    try {
      await Promise.all(
        nextPhotos.map((photo, index) =>
          patchPhoto(photo.id, { selected_order: index + 1, selected_size: photo.selected_size ?? "normal" }),
        ),
      );
      setPhotos(nextPhotos);
      setStatus(successMessage);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update Selected.");
    } finally {
      setPending(false);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    if (pending) return;
    const target = index + direction;
    if (target < 0 || target >= orderedPhotos.length) return;
    const next = [...orderedPhotos];
    [next[index], next[target]] = [next[target], next[index]];
    await persist(next.map((photo, order) => ({ ...photo, selected_order: order + 1 })), "Selected order saved.");
  }

  async function toggleSize(photoId: string) {
    if (pending) return;
    const next: Photo[] = orderedPhotos.map((photo) =>
      photo.id === photoId
        ? { ...photo, selected_size: photo.selected_size === "large" ? "normal" : "large" }
        : photo,
    );
    await persist(next, "Selected size saved.");
  }

  async function remove(photoId: string) {
    if (pending) return;
    setPending(true);
    setError(null);
    setStatus(null);
    try {
      await patchPhoto(photoId, { selected: false, selected_size: null, selected_order: null });
      const remainingPhotos = orderedPhotos
        .filter((photo) => photo.id !== photoId)
        .map((photo, index) => ({ ...photo, selected_order: index + 1 }));
      await Promise.all(
        remainingPhotos.map((photo, index) =>
          patchPhoto(photo.id, { selected_order: index + 1, selected_size: photo.selected_size ?? "normal" }),
        ),
      );
      setPhotos(remainingPhotos);
      setStatus("Photo removed from Selected.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove photo from Selected.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.layout}>
      <section>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {status ? <p className={styles.status} role="status">{status}</p> : null}
        {orderedPhotos.map((photo, index) => {
          const thumbnailUrl = getPublicImageUrl(photo.gallery_image_path);
          const selectedSize = photo.selected_size ?? "normal";
          const assetNote = !photo.gallery_image_path
            ? "Missing gallery thumbnail"
            : !photo.public_image_path
              ? "Missing public image"
              : null;

          return (
            <article key={photo.id}>
              <div className={styles.thumb}>
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="" width={photo.image_width ?? undefined} height={photo.image_height ?? undefined} loading="lazy" />
                ) : (
                  <span aria-hidden="true" style={{ background: getPhotoVisualStyle(photo.id) }} />
                )}
              </div>
              <section>
                <div className={styles.meta}>
                  <span>#{index + 1}</span>
                  <span data-tone={selectedSize === "large" ? "active" : "muted"}>{selectedSize}</span>
                  <span data-tone={photo.published ? "active" : "muted"}>{photo.published ? "public" : "draft"}</span>
                </div>
                <strong className="serif">{photo.original_filename}</strong>
                <span>{photo.location_name ?? "No location"}</span>
                {assetNote ? <em>{assetNote}</em> : null}
                <div className={styles.actions}>
                  <button onClick={() => move(index, -1)} disabled={pending || index === 0}>↑</button>
                  <button onClick={() => move(index, 1)} disabled={pending || index === orderedPhotos.length - 1}>↓</button>
                  <button onClick={() => toggleSize(photo.id)} disabled={pending}>
                    {selectedSize === "large" ? "Make normal" : "Make large"}
                  </button>
                  <button onClick={() => remove(photo.id)} disabled={pending}>Remove</button>
                </div>
              </section>
            </article>
          );
        })}
      </section>
      <aside>
        <p className="eyebrow">Gallery rhythm preview</p>
        <div className={styles.preview}>
          {orderedPhotos.map((photo) => (
            <span key={photo.id} data-size={photo.selected_size ?? "normal"} />
          ))}
        </div>
      </aside>
    </div>
  );
}
