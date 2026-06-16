export type ExpiryPreset = "1" | "7" | "30";

export interface ComposeDraft {
  message: string;
  expiryDays: ExpiryPreset;
}

export interface UnlockDraft {
  pasteUrl: string;
}

export interface AppDrafts {
  compose?: ComposeDraft;
  unlock?: UnlockDraft;
  savedAt: string;
}

const DRAFTS_STORAGE_KEY = "picrypt-drafts";

export function loadDrafts(): AppDrafts | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as AppDrafts;
  } catch {
    return null;
  }
}

export function saveDrafts(drafts: Omit<AppDrafts, "savedAt">): AppDrafts {
  const payload: AppDrafts = {
    ...drafts,
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function clearComposeDraft(): void {
  const existing = loadDrafts();
  if (!existing?.compose) {
    return;
  }

  if (!existing.unlock) {
    localStorage.removeItem(DRAFTS_STORAGE_KEY);
    return;
  }

  saveDrafts({ unlock: existing.unlock });
}

export function clearUnlockDraft(): void {
  const existing = loadDrafts();
  if (!existing?.unlock) {
    return;
  }

  if (!existing.compose) {
    localStorage.removeItem(DRAFTS_STORAGE_KEY);
    return;
  }

  saveDrafts({ compose: existing.compose });
}
