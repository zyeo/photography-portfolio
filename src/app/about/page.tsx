import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import styles from "./page.module.css";

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className={`${styles.page} shell`}>
        <p className="eyebrow">About</p>
        <h1 className="display">Zach Yeo</h1>
        <p className="serif">
          I photograph the ordinary pressure of days: street corners, weather, transit,
          and the brief alignments that make a place feel newly visible.
        </p>
        <p className="serif">
          Based in Tokyo. Quietly available for portrait and editorial inquiries.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
