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

type UploadResult = {
  photos?: Photo[];
  skippedDuplicates?: string[];
  failedFiles?: Array<{ name: string; error: string }>;
  error?: string;
};

export function ArchiveUploadForm() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUploading) return;

    const form = event.currentTarget;
    const sourceFormData = new FormData(form);
    const files = sourceFormData
      .getAll("files")
      .filter((value): value is File => value instanceof File && value.size > 0);
    const fileCount = files.length;

    setIsUploading(true);
    setError(null);
    setStatus(`Uploading ${fileCount} photograph${fileCount === 1 ? "" : "s"}…`);

    try {
      const uploadedPhotos: Photo[] = [];
      const skippedDuplicates: string[] = [];
      const failedFiles: Array<{ name: string; error: string }> = [];

      for (const [index, file] of files.entries()) {
        setStatus(`Uploading ${index + 1} of ${fileCount}…`);

        const fileFormData = new FormData();
        fileFormData.append("files", file);
        fileFormData.append("medium", String(sourceFormData.get("medium") ?? "digital"));
        fileFormData.append("locationName", String(sourceFormData.get("locationName") ?? ""));
        if (sourceFormData.get("selected") === "on") {
          fileFormData.append("selected", "on");
        }

        const response = await fetch("/api/admin/archive", {
          method: "POST",
          body: fileFormData,
        });
        const payload = (await response.json()) as UploadResult;

        if (!response.ok) {
          failedFiles.push({
            name: file.name,
            error: payload.error ?? "Upload failed.",
          });
          continue;
        }

        uploadedPhotos.push(...(payload.photos ?? []));
        skippedDuplicates.push(...(payload.skippedDuplicates ?? []));
        failedFiles.push(...(payload.failedFiles ?? []));
      }

      setPhotos(uploadedPhotos);
      setStatus(
        `Uploaded ${uploadedPhotos.length}${
          skippedDuplicates.length
            ? `; skipped ${skippedDuplicates.length} duplicate${skippedDuplicates.length === 1 ? "" : "s"}`
            : ""
        }${failedFiles.length ? `; ${failedFiles.length} failed` : ""}.`,
      );
      setError(failedFiles.length ? failedFiles.map((file) => `${file.name}: ${file.error}`).join(" ") : null);
      form.reset();
    } catch {
      setError("Upload failed. Please try again.");
      setStatus(null);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit} aria-busy={isUploading}>
        <label>
          Photographs
          <input name="files" type="file" accept="image/*" multiple required disabled={isUploading} />
        </label>
        <div className={styles.grid}>
          <label>
            Shared medium
            <select name="medium" defaultValue="digital" disabled={isUploading}>
              <option value="digital">Digital</option>
              <option value="film">Film</option>
            </select>
          </label>
          <label>
            Shared location
            <input name="locationName" type="text" disabled={isUploading} />
          </label>
        </div>
        <label className={styles.checkbox}>
          <input name="selected" type="checkbox" disabled={isUploading} />
          Add uploaded photos to public Selected
        </label>
        <button type="submit" disabled={isUploading}>
          {isUploading ? "Uploading…" : "Upload archive batch"}
        </button>
        {status ? <p role="status">{status}</p> : null}
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
