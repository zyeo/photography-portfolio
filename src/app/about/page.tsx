import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import styles from "./page.module.css";

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className={`${styles.page} shell`}>
        <section className={styles.copy}>
          <p className="eyebrow">About</p>
          <h1 className="display">Zach Yeo</h1>
          <div className={styles.bio}>
            <p className="serif">
              I’m a Tokyo-based photographer drawn to street, portrait, and documentary-style work.
            </p>
            <p className="serif">
              My work focuses on everyday scenes, natural moments, and the small details that give
              people and places their character.
            </p>
            <p className="serif">
              Alongside my portfolio, I keep a photo journal as a daily challenge: a photo a day, a
              way to stay consistent and keep learning.
            </p>
            <p className={`serif ${styles.availability}`}>
              Available for portrait, editorial, and creative inquiries.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
