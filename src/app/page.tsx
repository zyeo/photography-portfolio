import Image from "next/image";
import Link from "next/link";
import { HeroRotator } from "@/components/public/hero-rotator";
import { getHomepageData } from "@/lib/public/photos";
import styles from "./page.module.css";

export default async function Home() {
  const { heroPhotos } = await getHomepageData();

  return (
    <main className={styles.home}>
      <HeroRotator photos={heroPhotos} />
      <div className={styles.overlay} />
      <section className={styles.identity}>
        <Image
          className={styles.wordmark}
          src="/brand/zach-yeo-signature-white-transparent.png"
          alt="Zach Yeo"
          width={1100}
          height={650}
          priority
        />
        <p>Tokyo, for now</p>
        <span>Photographs and notes from an ongoing practice.</span>
      </section>
      <footer className={styles.ritual}>
        <nav aria-label="Primary navigation">
          <Link href="/selected">Selected</Link>
          <Link href="/collections">Collections</Link>
          <Link href="/journal">Journal</Link>
          <Link href="/about">About</Link>
        </nav>
        <div>
          <a href="https://instagram.com" aria-label="Instagram">◎</a>
          <a href="mailto:hello@zachyeo.com" aria-label="Email">✉</a>
        </div>
      </footer>
    </main>
  );
}
