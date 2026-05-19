"use client";

import { useState, type FormEvent } from "react";
import { directUploadOriginal } from "@/lib/admin/direct-upload";
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
    const file = formData.get("file");
    if (!(file instanceof File)) {
      setResult({ error: "Image file is required." });
      setIsUploading(false);
      return;
    }

    try {
      const upload = await directUploadOriginal(file);
      const response = await fetch("/api/admin/uploads/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "library-photo",
          ...upload,
        }),
      });
      const payload = (await response.json()) as UploadResult;
      setResult(payload);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Upload failed." });
    }
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
