"use client";

import { useEffect, useId, useRef, useState } from "react";
import { getPhotoBackgroundStyle, getPublicImageUrl } from "@/lib/public/visuals";
import styles from "./lightbox-gallery.module.css";

type Photo = {
  id: string;
  original_filename: string;
  public_image_path: string | null;
  image_width: number | null;
  image_height: number | null;
  location_name: string | null;
  date_taken: string | null;
  selected_size?: "normal" | "large" | null;
};

type PhotoCategory = "portrait" | "landscape" | "square-ish" | "panorama" | "unknown";

function getAspectRatio(photo: Photo) {
  return photo.image_width && photo.image_height ? photo.image_width / photo.image_height : null;
}

function getPhotoCategory(photo: Photo): PhotoCategory {
  const aspectRatio = getAspectRatio(photo);

  if (!aspectRatio) return "unknown";
  if (aspectRatio >= 2) return "panorama";
  if (aspectRatio > 1.08) return "landscape";
  if (aspectRatio < 0.92) return "portrait";
  return "square-ish";
}

function balancePhotosForMasonry(photos: Photo[]) {
  const categories: Record<PhotoCategory, Photo[]> = {
    portrait: [],
    landscape: [],
    "square-ish": [],
    panorama: [],
    unknown: [],
  };

  for (const photo of photos) {
    categories[getPhotoCategory(photo)].push(photo);
  }

  const populatedCategories = (Object.keys(categories) as PhotoCategory[]).filter(
    (category) => category !== "unknown" && categories[category].length > 0,
  );

  if (populatedCategories.length < 2) return photos;

  const ordered: Photo[] = [];
  let lastCategory: PhotoCategory | null = null;

  while (ordered.length < photos.length) {
    const nextCategory =
      populatedCategories.find((category) => category !== lastCategory && categories[category].length > 0) ??
      populatedCategories.find((category) => categories[category].length > 0) ??
      "unknown";
    const nextPhoto = categories[nextCategory].shift() ?? categories.unknown.shift();

    if (!nextPhoto) break;

    ordered.push(nextPhoto);
    lastCategory = getPhotoCategory(nextPhoto);
  }

  return ordered.concat(categories.unknown);
}

export function LightboxGallery({ photos }: { photos: Photo[] }) {
  const orderedPhotos = balancePhotosForMasonry(photos);
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
        {orderedPhotos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            data-size={photo.selected_size ?? "normal"}
            data-category={getPhotoCategory(photo)}
            style={getPhotoBackgroundStyle(photo.id, null)}
            onClick={(event) => openPhoto(photo, event.currentTarget)}
            aria-label={`Open ${photo.original_filename}`}
          >
            {getPublicImageUrl(photo.public_image_path) ? (
              <img
                src={getPublicImageUrl(photo.public_image_path) ?? undefined}
                alt=""
                width={photo.image_width ?? undefined}
                height={photo.image_height ?? undefined}
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
                width={active.image_width ?? undefined}
                height={active.image_height ?? undefined}
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
