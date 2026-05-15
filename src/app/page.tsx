import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import styles from "./page.module.css";

const latestEntries = [
  {
    date: "May 14",
    title: "Rain holding on the tram window",
    location: "Setagaya",
  },
  {
    date: "May 13",
    title: "Late light on vending glass",
    location: "Koenji",
  },
  {
    date: "May 12",
    title: "Cyclist beneath the overpass",
    location: "Nakano",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className={`${styles.hero} shell`} aria-label="Featured photograph">
          <div className={styles.heroImage} aria-hidden="true" />
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <p className="eyebrow">Daily photography journal</p>
            <h1 className="display">One photograph a day, kept with attention.</h1>
            <p className="serif">
              A living archive of Tokyo walks, small weather, and the discipline of
              noticing before the moment disappears.
            </p>
            <div className={styles.heroLinks}>
              <Link className="utility-link" href="/selected">
                View selected work
              </Link>
              <Link className="utility-link" href="/journal">
                Read the journal
              </Link>
            </div>
          </div>
        </section>

        <section className={`${styles.threshold} shell`} aria-labelledby="threshold-title">
          <div>
            <p className="eyebrow">Intent</p>
            <h2 id="threshold-title" className="display">
              The portfolio shows the eye. The journal shows the practice behind it.
            </h2>
          </div>
          <p className="serif">
            Finished work and daily work live side by side here: one edited, one
            ongoing, both part of the same way of looking.
          </p>
        </section>

        <section className={`${styles.latest} shell`} aria-labelledby="latest-title">
          <div className={styles.sectionHeading}>
            <p className="eyebrow">Latest journal</p>
            <h2 id="latest-title" className="display">
              Recent entries
            </h2>
          </div>
          <ol>
            {latestEntries.map((entry) => (
              <li key={entry.title}>
                <span>{entry.date}</span>
                <strong className="serif">{entry.title}</strong>
                <em>{entry.location}</em>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
