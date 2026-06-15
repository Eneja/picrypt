const DROP_ID_PATTERN = /^[A-Za-z0-9_-]{12}$/;

export function isValidDropId(id: string): boolean {
  return DROP_ID_PATTERN.test(id);
}

export function buildShareUrl(id: string, key: string, baseUrl?: string): string {
  const base = (baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return `${base}/i/${id}#${key}`;
}

export function parseShareUrl(url: string): { id: string; key: string } | null {
  try {
    const parsed = new URL(url.trim());
    const match = parsed.pathname.match(/\/i\/([A-Za-z0-9_-]{12})$/);
    if (!match) {
      return null;
    }

    const key = parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash;
    if (!key) {
      return null;
    }

    return { id: match[1], key };
  } catch {
    return null;
  }
}

export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
