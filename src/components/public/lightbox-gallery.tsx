"use client";

import { useEffect, useId, useRef, useState } from "react";
import { getPhotoBackgroundStyle, getPublicImageUrl } from "@/lib/public/visuals";
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const dateId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (active && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [active]);

  function openPhoto(photo: Photo, opener: HTMLButtonElement) {
    openerRef.current = opener;
    setActive(photo);
  }

  function closeLightbox() {
    const dialog = dialogRef.current;

    if (dialog?.open) {
      dialog.close();
      return;
    }

    setActive(null);
  }

  function handleDialogClose() {
    setActive(null);
    openerRef.current?.focus();
  }

  return (
    <>
      <div className={styles.gallery}>
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            data-size={photo.selected_size ?? "normal"}
            style={getPhotoBackgroundStyle(photo.id, null)}
            onClick={(event) => openPhoto(photo, event.currentTarget)}
            aria-label={`Open ${photo.original_filename}`}
          >
            {getPublicImageUrl(photo.public_image_path) ? (
              <img
                src={getPublicImageUrl(photo.public_image_path) ?? undefined}
                alt=""
                loading="lazy"
              />
            ) : (
              <span
                aria-hidden="true"
                style={getPhotoBackgroundStyle(photo.id, photo.public_image_path)}
              />
            )}
          </button>
        ))}
      </div>
      {active ? (
        <dialog
          ref={dialogRef}
          className={styles.lightbox}
          aria-labelledby={titleId}
          aria-describedby={dateId}
          onClose={handleDialogClose}
          onCancel={(event) => {
            event.preventDefault();
            closeLightbox();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeLightbox();
            }
          }}
        >
          <button type="button" onClick={closeLightbox} autoFocus>
            Close
          </button>
          <div className={styles.lightboxImage}>
            {getPublicImageUrl(active.public_image_path) ? (
              <img
                src={getPublicImageUrl(active.public_image_path) ?? undefined}
                alt={active.original_filename}
              />
            ) : (
              <span
                role="img"
                aria-label={active.original_filename}
                style={getPhotoBackgroundStyle(active.id, active.public_image_path)}
              />
            )}
          </div>
          <p id={titleId}>{active.location_name ?? "Untitled place"}</p>
          <span id={dateId}>{active.date_taken?.slice(0, 10) ?? "Undated"}</span>
        </dialog>
      ) : null}
    </>
  );
}
