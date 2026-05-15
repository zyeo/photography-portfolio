"use client";

import { useState } from "react";
import styles from "./hero-manager.module.css";

type HeroPhoto = {
  id: string;
  original_filename: string;
  pinned_hero: boolean;
  focal_point_x: number;
  focal_point_y: number;
};

export function HeroManager({ initialPhotos }: { initialPhotos: HeroPhoto[] }) {
  const [photos, setPhotos] = useState(initialPhotos);

  async function pin(photoId: string | null) {
    await fetch("/api/admin/homepage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId }),
    });
    setPhotos((current) => current.map((photo) => ({ ...photo, pinned_hero: photo.id === photoId })));
  }

  async function updateFocal(photoId: string, axis: "focal_point_x" | "focal_point_y", value: number) {
    await fetch(`/api/admin/photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [axis]: value }),
    });
    setPhotos((current) => current.map((photo) => photo.id === photoId ? { ...photo, [axis]: value } : photo));
  }

  return (
    <div className={styles.list}>
      <button onClick={() => pin(null)}>Resume rotation</button>
      {photos.map((photo) => (
        <article key={photo.id}>
          <strong className="serif">{photo.original_filename}</strong>
          <span>{photo.pinned_hero ? "Pinned hero" : "Rotation-ready"}</span>
          <div>
            <label>X<input type="range" min="0" max="1" step="0.01" value={photo.focal_point_x} onChange={(event) => updateFocal(photo.id, "focal_point_x", Number(event.target.value))} /></label>
            <label>Y<input type="range" min="0" max="1" step="0.01" value={photo.focal_point_y} onChange={(event) => updateFocal(photo.id, "focal_point_y", Number(event.target.value))} /></label>
          </div>
          <button onClick={() => pin(photo.id)}>Pin hero</button>
        </article>
      ))}
    </div>
  );
}
