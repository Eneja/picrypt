export function validatePersonName(name: string, label: "First" | "Last"): string | null {
  const trimmed = name.trim();

  if (!trimmed) {
    return `${label} name is required.`;
  }

  if (trimmed.length > 50) {
    return `${label} name must be 50 characters or fewer.`;
  }

  if (!/^[\p{L}\p{M}' -]+$/u.test(trimmed)) {
    return `${label} name can only contain letters, spaces, hyphens, and apostrophes.`;
  }

  return null;
}

export function normalizePersonName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}
