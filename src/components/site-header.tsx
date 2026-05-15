import Image from "next/image";
import Link from "next/link";
import styles from "./site-header.module.css";

const links = [
  { href: "/selected", label: "Selected" },
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className={`${styles.header} shell`}>
      <span aria-hidden="true" />
      <Link className={styles.signature} href="/" aria-label="Zach Yeo home">
        <Image src="/brand/zach-yeo-signature-charcoal-transparent.png" alt="" width={1100} height={650} />
      </Link>
      <nav aria-label="Primary navigation">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>{link.label}</Link>
        ))}
      </nav>
    </header>
  );
}
