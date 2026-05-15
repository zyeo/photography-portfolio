"use client";

import { useState, type FormEvent } from "react";
import styles from "./archive-upload-form.module.css";

type Photo = {
  id: string;
  original_filename: string;
  location_name: string | null;
  medium: "digital" | "film";
  selected: boolean;
  date_taken: string | null;
  camera: string | null;
};

export function ArchiveUploadForm() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const response = await fetch("/api/admin/archive", {
      method: "POST",
      body: new FormData(event.currentTarget),
    });
    const payload = (await response.json()) as { photos?: Photo[]; error?: string };
    setPhotos(payload.photos ?? []);
    setError(payload.error ?? null);
  }

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label>
          Photographs
          <input name="files" type="file" accept="image/*" multiple required />
        </label>
        <div className={styles.grid}>
          <label>
            Shared medium
            <select name="medium" defaultValue="digital">
              <option value="digital">Digital</option>
              <option value="film">Film</option>
            </select>
          </label>
          <label>
            Shared location
            <input name="locationName" type="text" />
          </label>
        </div>
        <label className={styles.checkbox}>
          <input name="selected" type="checkbox" />
          Add uploaded photos to Selected
        </label>
        <button type="submit">Upload archive batch</button>
        {error ? <p role="alert">{error}</p> : null}
      </form>

      {photos.length ? (
        <section className={styles.review}>
          <p className="eyebrow">Review grid</p>
          {photos.map((photo) => (
            <article key={photo.id}>
              <strong className="serif">{photo.original_filename}</strong>
              <span>{photo.location_name ?? "No location"}</span>
              <span>{photo.date_taken ?? "No EXIF date"}</span>
              <span>{photo.camera ?? "No camera"}</span>
            </article>
          ))}
        </section>
      ) : null}
    </>
  );
}
