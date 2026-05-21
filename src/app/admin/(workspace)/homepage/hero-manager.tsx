"use client";

import { useState } from "react";
import { getPhotoVisualStyle, getPublicImageUrl } from "@/lib/public/visuals";
import styles from "./hero-manager.module.css";

type HeroPhoto = {
  id: string;
  original_filename: string;
  gallery_image_path: string | null;
  public_image_path: string | null;
  image_width: number | null;
  image_height: number | null;
  location_name: string | null;
  pinned_hero: boolean;
  focal_point_x: number;
  focal_point_y: number;
};

export function HeroManager({ initialPhotos }: { initialPhotos: HeroPhoto[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pin(photoId: string | null) {
    if (pending) return;
    setPending(true);
    setError(null);
    setStatus(null);
    try {
      const response = await fetch("/api/admin/homepage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not update pinned hero.");
      setPhotos((current) => current.map((photo) => ({ ...photo, pinned_hero: photo.id === photoId })));
      setStatus(photoId ? "Pinned hero saved." : "Hero rotation resumed.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update homepage hero.");
    } finally {
      setPending(false);
    }
  }

  async function updateFocal(photoId: string, axis: "focal_point_x" | "focal_point_y", value: number) {
    setPhotos((current) => current.map((photo) => photo.id === photoId ? { ...photo, [axis]: value } : photo));
    setError(null);
    setStatus(null);
    try {
      const response = await fetch(`/api/admin/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [axis]: value }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not update focal point.");
      setStatus("Focal point saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update focal point.");
    }
  }

  return (
    <div className={styles.list}>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {status ? <p className={styles.status} role="status">{status}</p> : null}
      <button onClick={() => pin(null)} disabled={pending}>Resume rotation</button>
      {photos.map((photo) => {
        const thumbnailUrl = getPublicImageUrl(photo.gallery_image_path);
        const assetNote = !photo.public_image_path
          ? "Missing full-size public image"
          : !photo.gallery_image_path
            ? "Missing gallery thumbnail"
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
                <span data-tone={photo.pinned_hero ? "pin" : "active"}>{photo.pinned_hero ? "Pinned hero" : "Rotation-ready"}</span>
                <span>{photo.location_name ?? "No location"}</span>
              </div>
              <strong className="serif">{photo.original_filename}</strong>
              {assetNote ? <em>{assetNote}</em> : null}
              <div className={styles.controls}>
                <label>X<input type="range" min="0" max="1" step="0.01" value={photo.focal_point_x} onChange={(event) => updateFocal(photo.id, "focal_point_x", Number(event.target.value))} /></label>
                <label>Y<input type="range" min="0" max="1" step="0.01" value={photo.focal_point_y} onChange={(event) => updateFocal(photo.id, "focal_point_y", Number(event.target.value))} /></label>
              </div>
              <button onClick={() => pin(photo.id)} disabled={pending || photo.pinned_hero}>
                {photo.pinned_hero ? "Pinned" : "Pin hero"}
              </button>
            </section>
          </article>
        );
      })}
    </div>
  );
}
