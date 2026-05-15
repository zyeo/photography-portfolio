import Link from "next/link";
import styles from "./site-header.module.css";

const links = [
  { href: "/selected", label: "Selected" },
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
];

export function SiteHeader({ section }: { section?: string }) {
  return (
    <header className={`${styles.header} shell`}>
      <span className="page-kicker">{section}</span>
      <Link className={`${styles.signature} signature`} href="/" aria-label="Zach Yeo home">
        Zach Yeo
      </Link>
      <nav aria-label="Primary navigation">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>{link.label}</Link>
        ))}
      </nav>
    </header>
  );
}
