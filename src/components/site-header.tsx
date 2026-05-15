const links = [
  { href: "/selected", label: "Selected" },
  { href: "/journal", label: "Journal" },
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="shell site-header">
      <a className="wordmark display" href="/" aria-label="Zach Yeo home">
        Zach Yeo
      </a>
      <nav aria-label="Primary navigation">
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
