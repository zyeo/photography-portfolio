import Link from "next/link";

const links = [
  { href: "/selected", label: "Selected" },
  { href: "/journal", label: "Journal" },
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="shell site-header">
      <Link className="wordmark display" href="/" aria-label="Zach Yeo home">
        Zach Yeo
      </Link>
      <nav aria-label="Primary navigation">
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
