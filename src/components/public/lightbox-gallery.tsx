"use client";

import { useState } from "react";
import { getPhotoVisualStyle } from "@/lib/public/photos";
import styles from "./lightbox-gallery.module.css";

type Photo = {
  id: string;
  original_filename: string;
  location_name: string | null;
  date_taken: string | null;
  selected_size?: "normal" | "large" | null;
};

export function LightboxGallery({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState<Photo | null>(null);

  return (
    <>
      <div className={styles.gallery}>
        {photos.map((photo) => (
          <button
            key={photo.id}
            data-size={photo.selected_size ?? "normal"}
            style={{ background: getPhotoVisualStyle(photo.id) }}
            onClick={() => setActive(photo)}
            aria-label={`Open ${photo.original_filename}`}
          />
        ))}
      </div>
      {active ? (
        <dialog open className={styles.lightbox}>
          <button onClick={() => setActive(null)}>Close</button>
          <div style={{ background: getPhotoVisualStyle(active.id) }} />
          <p>{active.location_name ?? "Untitled place"}</p>
          <span>{active.date_taken?.slice(0, 10) ?? "Undated"}</span>
        </dialog>
      ) : null}
    </>
  );
}
