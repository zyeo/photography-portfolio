import Image from "next/image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import styles from "./page.module.css";

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className={`${styles.page} shell`}>
        <section className={styles.copy}>
          <h1 className={`eyebrow ${styles.title}`}>About</h1>
          <div className={styles.bio}>
            <p className="serif">
              Hello there! I’m <strong>Zach</strong>. I like taking photos of things. People. And
              places!
            </p>
            <p className="serif">
              <strong>Where?</strong> I like taking photos in nature and in cities.
            </p>
            <p className="serif">
              I also run a daily photo journal here as a way of staying consistent. But some days I
              forget to take photos. So I need to find a way of keeping myself accountable. If you
              have any ideas, please do let me know!
            </p>
            <p className={`serif ${styles.availability}`}>
              I’m currently based in Tokyo. If you would like to work with me, please send me a
              message. I’m sure I would like to work with you too. {" "}
              <span className={styles.smiley}>:-)</span>
            </p>
          </div>
        </section>
        <figure className={styles.portrait}>
          <Image
            src="/about/zach-profile.webp"
            alt="Zach sitting in a forest with a camera"
            width={960}
            height={1280}
            sizes="(min-width: 56rem) 24rem, calc(100vw - 2rem)"
          />
        </figure>
      </main>
      <SiteFooter />
    </>
  );
}
