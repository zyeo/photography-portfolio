"use client";

import { useState } from "react";
import { getPhotoBackgroundStyle } from "@/lib/public/visuals";
import styles from "./lightbox-gallery.module.css";

type Photo = {
  id: string;
  original_filename: string;
  public_image_path: string | null;
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
            style={getPhotoBackgroundStyle(photo.id, photo.public_image_path)}
            onClick={() => setActive(photo)}
            aria-label={`Open ${photo.original_filename}`}
          />
        ))}
      </div>
      {active ? (
        <dialog open className={styles.lightbox}>
          <button onClick={() => setActive(null)}>Close</button>
          <div style={getPhotoBackgroundStyle(active.id, active.public_image_path)} />
          <p>{active.location_name ?? "Untitled place"}</p>
          <span>{active.date_taken?.slice(0, 10) ?? "Undated"}</span>
        </dialog>
      ) : null}
    </>
  );
}
