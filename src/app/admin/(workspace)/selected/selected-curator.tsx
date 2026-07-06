"use client";

import { useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { getPhotoVisualStyle, getPublicImageUrl } from "@/lib/public/visuals";
import { buildDefaultSelectedLayoutItems } from "@/lib/selected-layout/layout.mjs";
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
  layout_id: string | null;
  photo_id: string;
  desktop_x: number;
  desktop_y: number;
  desktop_width: number;
  desktop_z_index: number;
  mobile_order: number | null;
  caption: string | null;
};

type DragState = {
  photoId: string;
  grabXPercent: number;
  grabYCanvas: number;
};

const SNAP_X = 2;
const SNAP_Y = 1;
const SNAP_WIDTH = 2;
const MIN_WIDTH = 12;
const MAX_WIDTH = 92;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function snap(value: number, increment: number) {
  return Math.round(value / increment) * increment;
}

function aspectRatio(photo: Photo) {
  return photo.image_width && photo.image_height ? photo.image_width / photo.image_height : 1.3;
}

function estimateBottom(photo: Photo) {
  const captionHeight = photo.caption ? 4 : 0;
  return photo.desktop_y + photo.desktop_width / aspectRatio(photo) + captionHeight;
}

function normalizeMobileOrder(photos: Photo[]) {
  return [...photos]
    .sort((a, b) => (a.mobile_order ?? 999) - (b.mobile_order ?? 999) || (a.selected_order ?? 999) - (b.selected_order ?? 999))
    .map((photo, index) => ({ ...photo, mobile_order: index + 1 }));
}

export function SelectedCurator({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(() => normalizeMobileOrder(initialPhotos));
  const [activeId, setActiveId] = useState(initialPhotos[0]?.id ?? null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [pending, setPending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const artboardRef = useRef<HTMLDivElement>(null);

  const activePhoto = photos.find((photo) => photo.id === activeId) ?? photos[0] ?? null;
  const mobilePhotos = useMemo(() => normalizeMobileOrder(photos), [photos]);
  const artboardHeight = Math.max(34, ...photos.map(estimateBottom)) + 2;

  function updatePhoto(photoId: string, update: (photo: Photo) => Photo) {
    setPhotos((current) => current.map((photo) => (photo.id === photoId ? update(photo) : photo)));
    setDirty(true);
    setStatus(null);
  }

  function movePhoto(photoId: string, deltaX: number, deltaY: number) {
    updatePhoto(photoId, (photo) => ({
      ...photo,
      desktop_x: clamp(snap(photo.desktop_x + deltaX, SNAP_X), 0, 100 - photo.desktop_width),
      desktop_y: Math.max(0, snap(photo.desktop_y + deltaY, SNAP_Y)),
    }));
  }

  function resizePhoto(photoId: string, deltaWidth: number) {
    updatePhoto(photoId, (photo) => {
      const desktop_width = clamp(snap(photo.desktop_width + deltaWidth, SNAP_WIDTH), MIN_WIDTH, MAX_WIDTH);
      return {
        ...photo,
        desktop_width,
        desktop_x: clamp(photo.desktop_x, 0, 100 - desktop_width),
      };
    });
  }

  function changeMobileOrder(photoId: string, direction: -1 | 1) {
    const ordered = normalizeMobileOrder(photos);
    const index = ordered.findIndex((photo) => photo.id === photoId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    setPhotos(next.map((photo, order) => ({ ...photo, mobile_order: order + 1 })));
    setDirty(true);
    setStatus(null);
  }

  function resetAutoLayout() {
    const captionsByPhotoId = new Map(photos.map((photo) => [photo.id, photo.caption]));
    const defaultsByPhotoId = new Map(
      buildDefaultSelectedLayoutItems(photos).map((item) => [item.photo_id, item]),
    );

    setPhotos((current) =>
      current.map((photo) => {
        const layout = defaultsByPhotoId.get(photo.id);

        return {
          ...photo,
          desktop_x: layout?.desktop_x ?? photo.desktop_x,
          desktop_y: layout?.desktop_y ?? photo.desktop_y,
          desktop_width: layout?.desktop_width ?? photo.desktop_width,
          desktop_z_index: layout?.desktop_z_index ?? 0,
          mobile_order: layout?.mobile_order ?? photo.mobile_order,
          caption: captionsByPhotoId.get(photo.id) ?? null,
        };
      }),
    );
    setDirty(true);
    setStatus("Auto layout restored. Save to publish these positions.");
    setError(null);
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>, photo: Photo) {
    const artboard = artboardRef.current;
    if (!artboard || pending) return;

    const rect = artboard.getBoundingClientRect();
    const artboardXPercent = ((event.clientX - rect.left + artboard.scrollLeft) / rect.width) * 100;
    const artboardYCanvas = ((event.clientY - rect.top + artboard.scrollTop) / rect.width) * 100;

    setActiveId(photo.id);
    setDragState({
      photoId: photo.id,
      grabXPercent: artboardXPercent - photo.desktop_x,
      grabYCanvas: artboardYCanvas - photo.desktop_y,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const artboard = artboardRef.current;
    if (!artboard || !dragState || pending) return;

    const rect = artboard.getBoundingClientRect();
    const photo = photos.find((current) => current.id === dragState.photoId);
    if (!photo) return;

    const nextX = ((event.clientX - rect.left + artboard.scrollLeft) / rect.width) * 100 - dragState.grabXPercent;
    const nextY = ((event.clientY - rect.top + artboard.scrollTop) / rect.width) * 100 - dragState.grabYCanvas;
    setPhotos((current) =>
      current.map((currentPhoto) =>
        currentPhoto.id === dragState.photoId
          ? {
              ...currentPhoto,
              desktop_x: clamp(snap(nextX, SNAP_X), 0, 100 - photo.desktop_width),
              desktop_y: Math.max(0, snap(nextY, SNAP_Y)),
            }
          : currentPhoto,
      ),
    );
    setDirty(true);
    setStatus(null);
  }

  function onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (dragState) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragState(null);
  }

  async function patchPhoto(photoId: string, body: Record<string, unknown>) {
    const response = await fetch(`/api/admin/photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Could not update selected photo.");
  }

  async function saveLayout() {
    setPending(true);
    setError(null);
    setStatus(null);
    try {
      const response = await fetch("/api/admin/selected-layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: normalizeMobileOrder(photos).map((photo) => ({
            photo_id: photo.id,
            desktop_x: photo.desktop_x,
            desktop_y: photo.desktop_y,
            desktop_width: photo.desktop_width,
            desktop_z_index: photo.desktop_z_index,
            mobile_order: photo.mobile_order,
            caption: photo.caption,
          })),
        }),
      });
      const payload = (await response.json()) as { items?: Photo[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not save Selected layout.");
      if (payload.items) setPhotos(normalizeMobileOrder(payload.items));
      setDirty(false);
      setStatus("Selected layout saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save Selected layout.");
    } finally {
      setPending(false);
    }
  }

  async function remove(photoId: string) {
    if (pending) return;
    setPending(true);
    setError(null);
    setStatus(null);
    try {
      await patchPhoto(photoId, { selected: false, selected_size: null, selected_order: null });
      const remaining = normalizeMobileOrder(photos.filter((photo) => photo.id !== photoId));
      setPhotos(remaining);
      setActiveId(remaining[0]?.id ?? null);
      setDirty(false);
      setStatus("Photo removed from Selected.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove photo from Selected.");
    } finally {
      setPending(false);
    }
  }

  if (!photos.length) {
    return <p className={styles.empty}>No photos are currently in Selected.</p>;
  }

  return (
    <div className={styles.layout}>
      <section className={styles.editor} aria-label="Selected desktop layout editor">
        <div className={styles.toolbar}>
          <div>
            <p className="eyebrow">Desktop artboard</p>
            <strong className="serif">Snap grid layout</strong>
          </div>
          <div className={styles.toolbarActions}>
            <button type="button" onClick={resetAutoLayout} disabled={pending}>
              Reset auto layout
            </button>
            <button type="button" onClick={saveLayout} disabled={pending || !dirty}>
              {pending ? "Saving..." : dirty ? "Save layout" : "Saved"}
            </button>
          </div>
        </div>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {status ? <p className={styles.status} role="status">{status}</p> : null}
        <div
          ref={artboardRef}
          className={styles.artboard}
          style={{ "--selected-editor-height": artboardHeight } as CSSProperties}
        >
          {photos.map((photo) => {
            const thumbnailUrl = getPublicImageUrl(photo.gallery_image_path);
            const selected = photo.id === activePhoto?.id;

            return (
              <button
                key={photo.id}
                type="button"
                className={styles.artboardItem}
                data-active={selected}
                style={{
                  left: `${photo.desktop_x}%`,
                  width: `${photo.desktop_width}%`,
                  zIndex: selected ? 10 : photo.desktop_z_index,
                  "--selected-editor-top": photo.desktop_y,
                } as CSSProperties}
                onClick={() => setActiveId(photo.id)}
                onPointerDown={(event) => onPointerDown(event, photo)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                disabled={pending}
              >
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt=""
                    width={photo.image_width ?? undefined}
                    height={photo.image_height ?? undefined}
                    loading="lazy"
                    draggable={false}
                  />
                ) : (
                  <span aria-hidden="true" style={{ background: getPhotoVisualStyle(photo.id) }} />
                )}
                {photo.caption ? <em>{photo.caption}</em> : null}
              </button>
            );
          })}
        </div>
      </section>
      <aside className={styles.inspector} aria-label="Selected layout controls">
        {activePhoto ? (
          <>
            <div className={styles.thumb}>
              {getPublicImageUrl(activePhoto.gallery_image_path) ? (
                <img
                  src={getPublicImageUrl(activePhoto.gallery_image_path) ?? undefined}
                  alt=""
                  width={activePhoto.image_width ?? undefined}
                  height={activePhoto.image_height ?? undefined}
                  loading="lazy"
                />
              ) : (
                <span aria-hidden="true" style={{ background: getPhotoVisualStyle(activePhoto.id) }} />
              )}
            </div>
            <div className={styles.meta}>
              <span>{activePhoto.published ? "public" : "draft"}</span>
              <span>{Math.round(activePhoto.desktop_width)}% wide</span>
              <span>mobile #{activePhoto.mobile_order ?? "-"}</span>
            </div>
            <strong className="serif">{activePhoto.original_filename}</strong>
            <span>{activePhoto.location_name ?? "No location"}</span>
            <label className={styles.captionField}>
              Caption
              <textarea
                value={activePhoto.caption ?? ""}
                maxLength={280}
                rows={4}
                onChange={(event) =>
                  updatePhoto(activePhoto.id, (photo) => ({ ...photo, caption: event.target.value || null }))
                }
              />
            </label>
            <div className={styles.controlGroup} aria-label="Position">
              <button type="button" onClick={() => movePhoto(activePhoto.id, 0, -SNAP_Y)} disabled={pending}>
                Up
              </button>
              <button type="button" onClick={() => movePhoto(activePhoto.id, 0, SNAP_Y)} disabled={pending}>
                Down
              </button>
              <button type="button" onClick={() => movePhoto(activePhoto.id, -SNAP_X, 0)} disabled={pending}>
                Left
              </button>
              <button type="button" onClick={() => movePhoto(activePhoto.id, SNAP_X, 0)} disabled={pending}>
                Right
              </button>
            </div>
            <div className={styles.controlGroup} aria-label="Size">
              <button type="button" onClick={() => resizePhoto(activePhoto.id, -SNAP_WIDTH)} disabled={pending}>
                Smaller
              </button>
              <button type="button" onClick={() => resizePhoto(activePhoto.id, SNAP_WIDTH)} disabled={pending}>
                Larger
              </button>
            </div>
            <div className={styles.controlGroup} aria-label="Mobile order">
              <button type="button" onClick={() => changeMobileOrder(activePhoto.id, -1)} disabled={pending}>
                Earlier mobile
              </button>
              <button type="button" onClick={() => changeMobileOrder(activePhoto.id, 1)} disabled={pending}>
                Later mobile
              </button>
            </div>
            <button type="button" className={styles.removeButton} onClick={() => remove(activePhoto.id)} disabled={pending}>
              Remove from Selected
            </button>
          </>
        ) : null}
        <section className={styles.mobileList}>
          <p className="eyebrow">Mobile order</p>
          {mobilePhotos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              data-active={photo.id === activePhoto?.id}
              onClick={() => setActiveId(photo.id)}
            >
              <span>#{photo.mobile_order}</span>
              {photo.original_filename}
            </button>
          ))}
        </section>
      </aside>
    </div>
  );
}
