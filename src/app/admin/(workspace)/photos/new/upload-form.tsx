"use client";

import { useState, type FormEvent } from "react";
import styles from "./upload-form.module.css";

type UploadResult = {
  photo?: {
    id: string;
    original_filename: string;
    date_taken: string | null;
    camera: string | null;
    lens: string | null;
    aperture: string | null;
    shutter_speed: string | null;
    iso: number | null;
  };
  error?: string;
};

export function UploadForm() {
  const [result, setResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsUploading(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/photos", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as UploadResult;

    setResult(payload);
    setIsUploading(false);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label>
        Photograph
        <input name="file" type="file" accept="image/*" required />
      </label>
      <button type="submit" disabled={isUploading}>
        {isUploading ? "Uploading…" : "Upload photograph"}
      </button>
      {result?.error ? <p role="alert">{result.error}</p> : null}
      {result?.photo ? (
        <dl>
          <div>
            <dt>File</dt>
            <dd>{result.photo.original_filename}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{result.photo.date_taken ?? "Not found"}</dd>
          </div>
          <div>
            <dt>Camera</dt>
            <dd>{result.photo.camera ?? "Not found"}</dd>
          </div>
          <div>
            <dt>Lens</dt>
            <dd>{result.photo.lens ?? "Not found"}</dd>
          </div>
          <div>
            <dt>Exposure</dt>
            <dd>
              {[result.photo.aperture, result.photo.shutter_speed, result.photo.iso]
                .filter(Boolean)
                .join(" · ") || "Not found"}
            </dd>
          </div>
        </dl>
      ) : null}
    </form>
  );
}
