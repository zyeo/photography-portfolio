type ContactIconLinksProps = {
  className?: string;
};

export function ContactIconLinks({ className }: ContactIconLinksProps) {
  return (
    <div className={className} aria-label="Contact links">
      <a href="https://www.instagram.com/aphoto._aday" aria-label="Instagram">
        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
          <rect x="4" y="4" width="16" height="16" rx="5" />
          <circle cx="12" cy="12" r="3.4" />
          <circle cx="16.8" cy="7.2" r="0.8" />
        </svg>
      </a>
      <a href="mailto:zacharyyeo22@gmail.com" aria-label="Email">
        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="m5 7 7 6 7-6" />
        </svg>
      </a>
    </div>
  );
}
