export default function Loading() {
  return (
    <main className="shell" style={{ paddingTop: "var(--space-5)", minHeight: "45vh" }}>
      <p className="eyebrow">Loading</p>
      <div style={{ width: "min(100%, 32rem)", height: "1px", background: "var(--line)" }} />
    </main>
  );
}
