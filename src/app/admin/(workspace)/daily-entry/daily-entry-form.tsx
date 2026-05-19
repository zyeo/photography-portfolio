"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { directUploadOriginal } from "@/lib/admin/direct-upload";
import styles from "./daily-entry-form.module.css";

type Result = {
  entry?: { id: string; entry_date: string; title: string };
  existingEntry?: { id: string; entry_date: string; title: string };
  error?: string;
};

export function DailyEntryForm({ today }: { today: string }) {
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);
    const formData = new FormData(event.currentTarget);
    const entryDate = String(formData.get("entryDate") ?? "").trim();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      setResult({ error: "Photograph is required." });
      setSubmitting(false);
      return;
    }

    try {
      const dateCheckResponse = await fetch("/api/admin/journal/check-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryDate }),
      });
      const dateCheck = (await dateCheckResponse.json()) as {
        available?: boolean;
        existingEntry?: { id: string; entry_date: string; title: string };
        error?: string;
      };

      if (!dateCheckResponse.ok) {
        throw new Error(dateCheck.error ?? "Could not check journal date.");
      }

      if (!dateCheck.available && dateCheck.existingEntry) {
        setResult({
          error: `A journal entry already exists for ${dateCheck.existingEntry.entry_date}.`,
          existingEntry: dateCheck.existingEntry,
        });
        setSubmitting(false);
        return;
      }

      const upload = await directUploadOriginal(file);
      const response = await fetch("/api/admin/uploads/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "daily-entry",
          ...upload,
          title: String(formData.get("title") ?? "").trim(),
          reflection: String(formData.get("reflection") ?? "").trim(),
          entryDate,
          locationName: String(formData.get("locationName") ?? "").trim() || null,
          weather: String(formData.get("weather") ?? "").trim() || null,
          heroApproved: formData.get("heroApproved") === "on",
          pinnedHero: formData.get("pinnedHero") === "on",
          published: formData.get("published") === "on",
          addToSelected: formData.get("addToSelected") === "on",
          focalPointX: Number(formData.get("focalPointX") ?? 0.5),
          focalPointY: Number(formData.get("focalPointY") ?? 0.5),
        }),
      });
      const payload = (await response.json()) as Result;
      setResult(payload);
      if (response.ok && payload.entry) {
        router.push("/admin/journal");
        router.refresh();
      }
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Upload failed." });
    }
    setSubmitting(false);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label>
        Photograph
        <input name="file" type="file" accept="image/*" required />
      </label>
      <div className={styles.grid}>
        <label>
          Date
          <input name="entryDate" type="date" defaultValue={today} required />
        </label>
        <label>
          Location
          <input name="locationName" type="text" />
        </label>
      </div>
      <label>
        Title
        <input name="title" type="text" required />
      </label>
      <label>
        Reflection
        <textarea name="reflection" rows={6} required />
      </label>
      <label>
        Weather
        <input name="weather" type="text" />
      </label>
      <div className={styles.grid}>
        <label>
          Focal X
          <input name="focalPointX" type="number" min="0" max="1" step="0.01" defaultValue="0.5" />
        </label>
        <label>
          Focal Y
          <input name="focalPointY" type="number" min="0" max="1" step="0.01" defaultValue="0.5" />
        </label>
      </div>
      <div className={styles.toggles}>
        <label>
          <input name="published" type="checkbox" defaultChecked />
          Publish immediately
          <small>Makes both the journal entry and linked photo public.</small>
        </label>
        <label>
          <input name="addToSelected" type="checkbox" />
          Add photo to Selected
          <small>Optional. Draft photos stay hidden from public Selected until published.</small>
        </label>
        <label>
          <input name="heroApproved" type="checkbox" />
          Hero approved
        </label>
        <label>
          <input name="pinnedHero" type="checkbox" />
          Pin as homepage hero
        </label>
      </div>
      <button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save daily entry"}
      </button>
      {result?.error ? <p role="alert">{result.error}</p> : null}
      {result?.existingEntry ? (
        <p role="status">
          An entry for {result.existingEntry.entry_date} already exists. <Link href="/admin/journal">Edit it in Journal</Link>.
        </p>
      ) : null}
      {result?.entry ? (
        <p role="status">Published “{result.entry.title}” for {result.entry.entry_date}.</p>
      ) : null}
    </form>
  );
}
