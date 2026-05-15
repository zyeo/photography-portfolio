import Link from "next/link";
import styles from "./admin-shell.module.css";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/daily-entry", label: "Daily Entry" },
  { href: "/admin/archive", label: "Archive Upload" },
  { href: "/admin/library", label: "Library" },
  { href: "/admin/selected", label: "Selected" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/homepage", label: "Homepage" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside>
        <p className="eyebrow">Admin</p>
        <nav aria-label="Admin navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
