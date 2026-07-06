"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  photoIds: string[];
  startX: number;
  startY: number;
  origins: {
    id: string;
    desktop_x: number;
    desktop_y: number;
    desktop_width: number;
  }[];
};

type SelectionBox = {
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
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

function estimateHeight(photo: Photo) {
  const captionHeight = photo.caption ? 4 : 0;
  return photo.desktop_width / aspectRatio(photo) + captionHeight;
}

function normalizeMobileOrder(photos: Photo[]) {
  return [...photos]
    .sort((a, b) => (a.mobile_order ?? 999) - (b.mobile_order ?? 999) || (a.selected_order ?? 999) - (b.selected_order ?? 999))
    .map((photo, index) => ({ ...photo, mobile_order: index + 1 }));
}

export function SelectedCurator({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(() => normalizeMobileOrder(initialPhotos));
  const [activeId, setActiveId] = useState<string | null>(initialPhotos[0]?.id ?? null);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => (initialPhotos[0]?.id ? [initialPhotos[0].id] : []));
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [pending, setPending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);
  const autoScrollFrameRef = useRef<number | null>(null);
  const lastPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const autoScrollActiveRef = useRef(false);
  const dragStateRef = useRef<DragState | null>(null);
  const selectionBoxRef = useRef<SelectionBox | null>(null);

  const activePhoto = photos.find((photo) => photo.id === activeId) ?? photos[0] ?? null;
  const mobilePhotos = useMemo(() => normalizeMobileOrder(photos), [photos]);
  const artboardHeight = Math.max(34, ...photos.map(estimateBottom)) + 2;
  const selectionStyle = selectionBox
    ? ({
        left: `${Math.min(selectionBox.startX, selectionBox.currentX)}%`,
        width: `${Math.abs(selectionBox.currentX - selectionBox.startX)}%`,
        "--selected-box-top": Math.min(selectionBox.startY, selectionBox.currentY),
        "--selected-box-height": Math.abs(selectionBox.currentY - selectionBox.startY),
      } as CSSProperties)
    : undefined;

  useEffect(() => {
    return () => {
      if (autoScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(autoScrollFrameRef.current);
      }
    };
  }, []);

  function setCurrentDragState(nextDragState: DragState | null) {
    dragStateRef.current = nextDragState;
    setDragState(nextDragState);
  }

  function setCurrentSelectionBox(nextSelectionBox: SelectionBox | null) {
    selectionBoxRef.current = nextSelectionBox;
    setSelectionBox(nextSelectionBox);
  }

  function startAutoScroll() {
    autoScrollActiveRef.current = true;
    if (autoScrollFrameRef.current !== null) return;

    const tick = () => {
      const editor = editorRef.current;
      const pointer = lastPointerRef.current;

      if (!editor || !pointer || !autoScrollActiveRef.current) {
        autoScrollFrameRef.current = null;
        return;
      }

      const rect = editor.getBoundingClientRect();
      const threshold = 72;
      const maxSpeed = 18;
      let speed = 0;

      if (pointer.clientY < rect.top + threshold) {
        speed = -maxSpeed * (1 - Math.max(pointer.clientY - rect.top, 0) / threshold);
      } else if (pointer.clientY > rect.bottom - threshold) {
        speed = maxSpeed * (1 - Math.max(rect.bottom - pointer.clientY, 0) / threshold);
      }

      if (speed) {
        editor.scrollBy({ top: speed, behavior: "auto" });
        updateDragFromClientPoint(pointer.clientX, pointer.clientY);
        updateSelectionFromClientPoint(pointer.clientX, pointer.clientY);
      }

      autoScrollFrameRef.current = window.requestAnimationFrame(tick);
    };

    autoScrollFrameRef.current = window.requestAnimationFrame(tick);
  }

  function stopAutoScroll() {
    autoScrollActiveRef.current = false;
    lastPointerRef.current = null;
    if (autoScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
  }

  function artboardPoint(event: PointerEvent<HTMLElement>) {
    return artboardPointFromClient(event.clientX, event.clientY);
  }

  function artboardPointFromClient(clientX: number, clientY: number) {
    const artboard = artboardRef.current;
    if (!artboard) return null;

    const rect = artboard.getBoundingClientRect();
    return {
      x: ((clientX - rect.left + artboard.scrollLeft) / rect.width) * 100,
      y: ((clientY - rect.top + artboard.scrollTop) / rect.width) * 100,
    };
  }

  function updateDragFromClientPoint(clientX: number, clientY: number) {
    const currentDragState = dragStateRef.current;
    if (!currentDragState || pending) return;
    const point = artboardPointFromClient(clientX, clientY);
    if (!point) return;

    const rawDeltaX = point.x - currentDragState.startX;
    const rawDeltaY = point.y - currentDragState.startY;
    const minDeltaX = Math.max(...currentDragState.origins.map((origin) => -origin.desktop_x));
    const maxDeltaX = Math.min(...currentDragState.origins.map((origin) => 100 - origin.desktop_width - origin.desktop_x));
    const minDeltaY = Math.max(...currentDragState.origins.map((origin) => -origin.desktop_y));
    const deltaX = snap(clamp(rawDeltaX, minDeltaX, maxDeltaX), SNAP_X);
    const deltaY = snap(Math.max(rawDeltaY, minDeltaY), SNAP_Y);
    const originsById = new Map(currentDragState.origins.map((origin) => [origin.id, origin]));

    setPhotos((current) =>
      current.map((currentPhoto) => {
        const origin = originsById.get(currentPhoto.id);

        return origin
          ? {
              ...currentPhoto,
              desktop_x: clamp(origin.desktop_x + deltaX, 0, 100 - currentPhoto.desktop_width),
              desktop_y: Math.max(0, origin.desktop_y + deltaY),
            }
          : currentPhoto;
      }),
    );
    setDirty(true);
    setStatus(null);
  }

  function updateSelectionFromClientPoint(clientX: number, clientY: number) {
    const currentSelectionBox = selectionBoxRef.current;
    if (!currentSelectionBox || pending) return;
    const point = artboardPointFromClient(clientX, clientY);
    if (!point) return;

    setCurrentSelectionBox({ ...currentSelectionBox, currentX: point.x, currentY: point.y });
  }

  function updatePhoto(photoId: string, update: (photo: Photo) => Photo) {
    setPhotos((current) => current.map((photo) => (photo.id === photoId ? update(photo) : photo)));
    setDirty(true);
    setStatus(null);
  }

  function movePhoto(photoId: string, deltaX: number, deltaY: number) {
    const ids = selectedIds.includes(photoId) ? selectedIds : [photoId];
    setPhotos((current) =>
      current.map((photo) =>
        ids.includes(photo.id)
          ? {
              ...photo,
              desktop_x: clamp(snap(photo.desktop_x + deltaX, SNAP_X), 0, 100 - photo.desktop_width),
              desktop_y: Math.max(0, snap(photo.desktop_y + deltaY, SNAP_Y)),
            }
          : photo,
      ),
    );
    setDirty(true);
    setStatus(null);
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
    if (!window.confirm("Reset the Selected desktop layout to the automatic arrangement? This will replace your current unsaved positions.")) {
      return;
    }

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
    setSelectedIds((current) => current.filter((id) => photos.some((photo) => photo.id === id)));
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>, photo: Photo) {
    if (pending) return;
    const point = artboardPoint(event);
    if (!point) return;

    let nextSelectedIds = selectedIds;
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      nextSelectedIds = selectedIds.includes(photo.id)
        ? selectedIds.filter((id) => id !== photo.id)
        : [...selectedIds, photo.id];
      if (!nextSelectedIds.length) nextSelectedIds = [photo.id];
      setSelectedIds(nextSelectedIds);
    } else if (!selectedIds.includes(photo.id)) {
      nextSelectedIds = [photo.id];
      setSelectedIds(nextSelectedIds);
    }

    setActiveId(photo.id);
    setCurrentDragState({
      photoIds: nextSelectedIds,
      startX: point.x,
      startY: point.y,
      origins: photos
        .filter((current) => nextSelectedIds.includes(current.id))
        .map((current) => ({
          id: current.id,
          desktop_x: current.desktop_x,
          desktop_y: current.desktop_y,
          desktop_width: current.desktop_width,
        })),
    });
    lastPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
    startAutoScroll();
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!dragStateRef.current || pending) return;
    lastPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
    startAutoScroll();
    updateDragFromClientPoint(event.clientX, event.clientY);
  }

  function onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (dragState) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setCurrentDragState(null);
    stopAutoScroll();
  }

  function onArtboardPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || pending) return;
    const point = artboardPoint(event);
    if (!point) return;

    setCurrentSelectionBox({
      pointerId: event.pointerId,
      startX: point.x,
      startY: point.y,
      currentX: point.x,
      currentY: point.y,
    });
    setActiveId(null);
    if (!event.shiftKey && !event.metaKey && !event.ctrlKey) {
      setSelectedIds([]);
    }
    lastPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
    startAutoScroll();
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onArtboardPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!selectionBoxRef.current || pending) return;
    lastPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
    startAutoScroll();
    updateSelectionFromClientPoint(event.clientX, event.clientY);
  }

  function finishSelection(event: PointerEvent<HTMLDivElement>) {
    if (!selectionBox) return;

    const left = Math.min(selectionBox.startX, selectionBox.currentX);
    const right = Math.max(selectionBox.startX, selectionBox.currentX);
    const top = Math.min(selectionBox.startY, selectionBox.currentY);
    const bottom = Math.max(selectionBox.startY, selectionBox.currentY);
    const boxedIds = photos
      .filter((photo) => {
        const photoLeft = photo.desktop_x;
        const photoRight = photo.desktop_x + photo.desktop_width;
        const photoTop = photo.desktop_y;
        const photoBottom = photo.desktop_y + estimateHeight(photo);
        return photoLeft <= right && photoRight >= left && photoTop <= bottom && photoBottom >= top;
      })
      .map((photo) => photo.id);

    setSelectedIds((current) => {
      if (event.shiftKey || event.metaKey || event.ctrlKey) {
        return Array.from(new Set([...current, ...boxedIds]));
      }

      return boxedIds;
    });
    setActiveId(boxedIds[0] ?? null);
    setCurrentSelectionBox(null);
    stopAutoScroll();
    event.currentTarget.releasePointerCapture(selectionBox.pointerId);
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
      <section ref={editorRef} className={styles.editor} aria-label="Selected desktop layout editor">
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
          onPointerDown={onArtboardPointerDown}
          onPointerMove={onArtboardPointerMove}
          onPointerUp={finishSelection}
          onPointerCancel={finishSelection}
        >
          {selectionBox ? <div className={styles.selectionBox} style={selectionStyle} aria-hidden="true" /> : null}
          {photos.map((photo) => {
            const thumbnailUrl = getPublicImageUrl(photo.gallery_image_path);
            const selected = photo.id === activePhoto?.id;
            const inSelection = selectedIds.includes(photo.id);

            return (
              <button
                key={photo.id}
                type="button"
                className={styles.artboardItem}
                data-active={selected}
                data-selected={inSelection}
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
