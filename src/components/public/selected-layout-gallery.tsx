"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { getPhotoBackgroundStyle, getPublicImageUrl } from "@/lib/public/visuals";
import styles from "./selected-layout-gallery.module.css";

type Photo = {
  id: string;
  original_filename: string;
  public_image_path: string | null;
  gallery_image_path: string | null;
  image_width: number | null;
  image_height: number | null;
  location_name: string | null;
  date_taken: string | null;
};

export type SelectedLayoutGalleryItem = Photo & {
  layout?: {
    desktop_x?: number | string | null;
    desktop_y?: number | string | null;
    desktop_width?: number | string | null;
    desktop_z_index?: number | string | null;
    mobile_order?: number | null;
    caption?: string | null;
  } | null;
};

function toCssPercent(value: number | string | null | undefined) {
  if (value === null || value === undefined) return undefined;
  return typeof value === "number" ? `${value}%` : value;
}

function toCssRem(value: number | string | null | undefined) {
  if (value === null || value === undefined) return undefined;
  return typeof value === "number" ? `${value}rem` : value;
}

function toCssNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return undefined;
  return typeof value === "number" ? String(value) : value;
}

function toNumericValue(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getAspectRatio(photo: Photo) {
  return photo.image_width && photo.image_height ? photo.image_width / photo.image_height : null;
}

function getEstimatedDesktopHeight(item: SelectedLayoutGalleryItem) {
  const width = item.layout?.desktop_width;
  const imageRatio = getAspectRatio(item);

  const widthValue = toNumericValue(width);

  if (!widthValue || !imageRatio) return 0;

  const captionHeight = item.layout?.caption ? 3.5 : 0;
  return Math.ceil(toNumericValue(item.layout?.desktop_y) + (widthValue * 0.96) / imageRatio + captionHeight);
}

export function SelectedLayoutGallery({ photos }: { photos: SelectedLayoutGalleryItem[] }) {
  const [loadedIds, setLoadedIds] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex === null ? null : photos[activeIndex] ?? null;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const desktopMinHeight = useMemo(
    () => Math.max(0, ...photos.map((photo) => getEstimatedDesktopHeight(photo))),
    [photos],
  );

  useEffect(() => {
    const dialog = dialogRef.current;

    if (active && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((current) => (current === null ? current : (current - 1 + photos.length) % photos.length));
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((current) => (current === null ? current : (current + 1) % photos.length));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, photos.length]);

  function markLoaded(photoId: string) {
    setLoadedIds((current) => (current.includes(photoId) ? current : [...current, photoId]));
  }

  function openPhoto(index: number, opener: HTMLButtonElement) {
    openerRef.current = opener;
    setActiveIndex(index);
  }

  function closeLightbox() {
    const dialog = dialogRef.current;

    if (dialog?.open) {
      dialog.close();
      return;
    }

    setActiveIndex(null);
  }

  function handleDialogClose() {
    setActiveIndex(null);
    openerRef.current?.focus();
  }

  function showPrevious() {
    setActiveIndex((current) => (current === null ? current : (current - 1 + photos.length) % photos.length));
  }

  function showNext() {
    setActiveIndex((current) => (current === null ? current : (current + 1) % photos.length));
  }

  return (
    <>
      <div
        className={styles.gallery}
        style={desktopMinHeight > 0 ? ({ minHeight: `${desktopMinHeight}rem` } as CSSProperties) : undefined}
      >
        {photos.map((photo, index) => {
          const galleryImageUrl = getPublicImageUrl(photo.gallery_image_path);
          const caption = photo.layout?.caption?.trim() ?? "";
          const order = photo.layout?.mobile_order ?? index;
          const itemStyle = {
            order,
            "--selected-gallery-left": toCssPercent(photo.layout?.desktop_x),
            "--selected-gallery-top": toCssRem(photo.layout?.desktop_y),
            "--selected-gallery-width": toCssPercent(photo.layout?.desktop_width),
            "--selected-gallery-z": toCssNumber(photo.layout?.desktop_z_index),
          } as CSSProperties;
          const ariaLabel = caption ? `Open ${caption}` : `Open ${photo.original_filename}`;

          return (
            <button
              key={photo.id}
              type="button"
              className={styles.item}
              data-loaded={loadedIds.includes(photo.id)}
              data-has-caption={caption ? "true" : "false"}
              style={itemStyle}
              onClick={(event) => openPhoto(index, event.currentTarget)}
              aria-label={ariaLabel}
            >
              <figure className={styles.figure}>
                {galleryImageUrl ? (
                  <img
                    src={galleryImageUrl}
                    alt=""
                    width={photo.image_width ?? undefined}
                    height={photo.image_height ?? undefined}
                    loading="lazy"
                    onLoad={() => markLoaded(photo.id)}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className={styles.fallback}
                    style={{
                      ...getPhotoBackgroundStyle(photo.id, photo.public_image_path),
                      ...(photo.image_width && photo.image_height
                        ? { aspectRatio: `${photo.image_width} / ${photo.image_height}` }
                        : {}),
                    }}
                  />
                )}
                {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
              </figure>
            </button>
          );
        })}
      </div>
      {active ? (
        <dialog
          ref={dialogRef}
          className={styles.lightbox}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
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
          <div className={styles.lightboxToolbar}>
            <button type="button" onClick={closeLightbox} autoFocus>
              Close
            </button>
            <span>{activeIndex === null ? null : `${activeIndex + 1} / ${photos.length}`}</span>
          </div>
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
                className={styles.lightboxFallback}
                style={{
                  ...getPhotoBackgroundStyle(active.id, active.public_image_path),
                  ...(active.image_width && active.image_height
                    ? { aspectRatio: `${active.image_width} / ${active.image_height}` }
                    : {}),
                }}
              />
            )}
          </div>
          <div className={styles.lightboxFooter}>
            <div>
              <p id={titleId}>{active.original_filename}</p>
              <span id={descriptionId}>{active.layout?.caption?.trim() || "Selected image"}</span>
            </div>
            {photos.length > 1 ? (
              <div className={styles.lightboxNav}>
                <button type="button" onClick={showPrevious} aria-label="Previous image">
                  Previous
                </button>
                <button type="button" onClick={showNext} aria-label="Next image">
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </dialog>
      ) : null}
    </>
  );
}
