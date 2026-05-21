import { ContactIconLinks } from "./contact-icon-links";

export function SiteFooter() {
  return (
    <footer className="shell site-footer">
      <p>Made with ❤️ in Tokyo, Japan.</p>
      <ContactIconLinks className="site-footer-links" />
    </footer>
  );
}
