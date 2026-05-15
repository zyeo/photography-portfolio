"use client";

import { useState, type FormEvent } from "react";
import styles from "./daily-entry-form.module.css";

type Result = { entry?: { id: string; entry_date: string; title: string }; error?: string };

export function DailyEntryForm({ today }: { today: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);
    const response = await fetch("/api/admin/daily-entry", {
      method: "POST",
      body: new FormData(event.currentTarget),
    });
    setResult((await response.json()) as Result);
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
          <input name="heroApproved" type="checkbox" />
          Hero approved
        </label>
        <label>
          <input name="pinnedHero" type="checkbox" />
          Pin as homepage hero
        </label>
      </div>
      <button type="submit" disabled={submitting}>
        {submitting ? "Publishing…" : "Publish daily entry"}
      </button>
      {result?.error ? <p role="alert">{result.error}</p> : null}
      {result?.entry ? (
        <p role="status">Published “{result.entry.title}” for {result.entry.entry_date}.</p>
      ) : null}
    </form>
  );
}
