"use client";

import { useState, type FormEvent } from "react";
import styles from "./collection-manager.module.css";

type Collection = {
  id: string;
  title: string;
  slug: string;
  type: "medium" | "project" | "theme";
  published: boolean;
  display_order: number | null;
};

type Photo = { id: string; original_filename: string };

export function CollectionManager({ initialCollections, photos }: { initialCollections: Collection[]; photos: Photo[] }) {
  const [collections, setCollections] = useState(initialCollections);
  const [activeId, setActiveId] = useState<string | null>(initialCollections[0]?.id ?? null);

  async function createCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/admin/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const payload = (await response.json()) as { collection: Collection };
    setCollections((current) => [...current, payload.collection]);
    setActiveId(payload.collection.id);
    form.reset();
  }

  async function assignPhoto(photoId: string) {
    if (!activeId) return;
    await fetch(`/api/admin/collections/${activeId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId }),
    });
  }

  return (
    <div className={styles.layout}>
      <section>
        {collections.map((collection) => (
          <button key={collection.id} onClick={() => setActiveId(collection.id)} data-active={collection.id === activeId}>
            <strong>{collection.title}</strong>
            <span>{collection.type}</span>
          </button>
        ))}
      </section>
      <aside>
        <form onSubmit={createCollection}>
          <label>Title<input name="title" required /></label>
          <label>Slug<input name="slug" required /></label>
          <label>Type<select name="type" defaultValue="theme"><option value="medium">Medium</option><option value="project">Project</option><option value="theme">Theme</option></select></label>
          <label>Description<textarea name="description" rows={3} /></label>
          <button type="submit">Create collection</button>
        </form>
        <div className={styles.assignments}>
          <p className="eyebrow">Add photo to active collection</p>
          {photos.map((photo) => (
            <button key={photo.id} onClick={() => assignPhoto(photo.id)}>{photo.original_filename}</button>
          ))}
        </div>
      </aside>
    </div>
  );
}
