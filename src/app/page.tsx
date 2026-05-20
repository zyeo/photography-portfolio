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
        <p>TOKYO, FOR NOW</p>
        <span>Photographs and notes from an ongoing practice</span>
      </section>
      <footer className={styles.ritual}>
        <nav aria-label="Primary navigation">
          <Link href="/selected">Selected</Link>
          <Link href="/journal">Journal</Link>
          <Link href="/collections">Collections</Link>
          <Link href="/about">About</Link>
        </nav>
        <div>
          <a href="https://www.instagram.com/aphoto._aday" aria-label="Instagram">◎</a>
          <a href="mailto:zacharyyeo22@gmail.com" aria-label="Email">✉</a>
        </div>
      </footer>
    </main>
  );
}
