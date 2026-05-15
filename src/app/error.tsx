"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="shell" style={{ paddingTop: "var(--space-5)", minHeight: "45vh" }}>
      <p className="eyebrow">Something shifted</p>
      <h1 className="display" style={{ fontSize: "clamp(2rem, 1.5rem + 2vw, 3.5rem)" }}>
        The page could not be loaded.
      </h1>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
