/** Extract a display-friendly host + path: "https://www.prisma.io/docs/" -> "prisma.io/docs" */
export function displayAddress(link: string): string {
  try {
    const url = new URL(link);
    const host = url.hostname.replace(/^www\./, '');
    const path = url.pathname.replace(/\/$/, '');
    return path ? `${host}${path}` : host;
  } catch {
    return link;
  }
}

/** Hostname used for grouping/monogram fallbacks: "https://www.prisma.io/docs" -> "prisma.io" */
export function displayHost(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return link;
  }
}

/** Bare-domain label for the inspector header: "https://www.prisma.io/docs" -> "prisma.io" */
export function siteName(link: string): string {
  return displayHost(link);
}

/** Monogram shown in the 30x30 tile. First letter, or first two characters when the site starts with a digit. */
export function monogram(link: string): string {
  const host = displayHost(link);
  const firstLabel = host.split('.')[0] ?? host;
  const first = firstLabel.charAt(0).toUpperCase();
  if (/[0-9]/.test(first)) {
    return firstLabel.slice(0, 2).toUpperCase();
  }
  return first || '?';
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

/** Normalize a user-entered link: default to https:// when the scheme is missing. */
export function normalizeLink(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isValidHttpUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
