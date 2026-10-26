export function Sparkle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 0C12.9 7.6 16.4 11.1 24 12C16.4 12.9 12.9 16.4 12 24C11.1 16.4 7.6 12.9 0 12C7.6 11.1 11.1 7.6 12 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Tiara({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 48" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 40C30 46 66 46 88 40" />
        <path d="M8 40L13 24L24 34L33 17L41 30L48 9L55 30L63 17L72 34L83 24L88 40" />
        <path d="M48 2L51.5 6L48 10L44.5 6Z" />
        <circle cx="13" cy="21.5" r="2" />
        <circle cx="33" cy="14.5" r="2" />
        <circle cx="63" cy="14.5" r="2" />
        <circle cx="83" cy="21.5" r="2" />
        <circle cx="30" cy="40.5" r="1.1" />
        <circle cx="48" cy="42" r="1.4" />
        <circle cx="66" cy="40.5" r="1.1" />
      </g>
    </svg>
  );
}

export function Instagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r=".8" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
