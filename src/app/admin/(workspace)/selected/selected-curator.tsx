"use client";

import { useMemo, useState } from "react";
import styles from "./selected-curator.module.css";

type Photo = {
  id: string;
  original_filename: string;
  selected_size: "normal" | "large" | null;
  selected_order: number | null;
};

export function SelectedCurator({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const orderedPhotos = useMemo(
    () => [...photos].sort((a, b) => (a.selected_order ?? 999) - (b.selected_order ?? 999)),
    [photos],
  );

  async function persist(nextPhotos: Photo[]) {
    setPhotos(nextPhotos);
    await Promise.all(
      nextPhotos.map((photo, index) =>
        fetch(`/api/admin/photos/${photo.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_order: index + 1, selected_size: photo.selected_size ?? "normal" }),
        }),
      ),
    );
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= orderedPhotos.length) return;
    const next = [...orderedPhotos];
    [next[index], next[target]] = [next[target], next[index]];
    await persist(next.map((photo, order) => ({ ...photo, selected_order: order + 1 })));
  }

  async function toggleSize(photoId: string) {
    const next: Photo[] = orderedPhotos.map((photo) =>
      photo.id === photoId
        ? { ...photo, selected_size: photo.selected_size === "large" ? "normal" : "large" }
        : photo,
    );
    await persist(next);
  }

  async function remove(photoId: string) {
    await fetch(`/api/admin/photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected: false, selected_size: null, selected_order: null }),
    });
    await persist(orderedPhotos.filter((photo) => photo.id !== photoId));
  }

  return (
    <div className={styles.layout}>
      <section>
        {orderedPhotos.map((photo, index) => (
          <article key={photo.id}>
            <strong className="serif">{photo.original_filename}</strong>
            <span>{photo.selected_size ?? "normal"}</span>
            <div>
              <button onClick={() => move(index, -1)} disabled={index === 0}>↑</button>
              <button onClick={() => move(index, 1)} disabled={index === orderedPhotos.length - 1}>↓</button>
              <button onClick={() => toggleSize(photo.id)}>Toggle size</button>
              <button onClick={() => remove(photo.id)}>Remove</button>
            </div>
          </article>
        ))}
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
