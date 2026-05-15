import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="shell" style={{ paddingTop: "var(--space-5)", minHeight: "45vh" }}>
        <p className="eyebrow">Not found</p>
        <h1 className="display" style={{ fontSize: "clamp(2rem, 1.5rem + 2vw, 3.5rem)" }}>
          That frame is not in the archive.
        </h1>
        <Link className="utility-link" href="/journal">Return to journal</Link>
      </main>
      <SiteFooter />
    </>
  );
}
