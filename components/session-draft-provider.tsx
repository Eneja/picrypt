"use client";

import {
  loadDrafts,
  saveDrafts,
  type ComposeDraft,
  type UnlockDraft,
} from "@/lib/drafts";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

interface DraftCollector {
  getSnapshot: () => ComposeDraft | UnlockDraft | null;
  hasUnsavedWork: () => boolean;
}

interface SessionDraftContextValue {
  registerCollector: (id: string, collector: DraftCollector) => () => void;
  saveAllDrafts: () => boolean;
  hasUnsavedWork: () => boolean;
}

const SessionDraftContext = createContext<SessionDraftContextValue | null>(null);

export function SessionDraftProvider({ children }: { children: ReactNode }) {
  const collectorsRef = useRef(new Map<string, DraftCollector>());

  const registerCollector = useCallback((id: string, collector: DraftCollector) => {
    collectorsRef.current.set(id, collector);
    return () => {
      collectorsRef.current.delete(id);
    };
  }, []);

  const hasUnsavedWork = useCallback(() => {
    for (const collector of collectorsRef.current.values()) {
      if (collector.hasUnsavedWork()) {
        return true;
      }
    }

    return false;
  }, []);

  const saveAllDrafts = useCallback(() => {
    const existing = loadDrafts();
    const next: { compose?: ComposeDraft; unlock?: UnlockDraft } = {
      compose: existing?.compose,
      unlock: existing?.unlock,
    };

    let savedSomething = false;

    for (const [id, collector] of collectorsRef.current.entries()) {
      if (!collector.hasUnsavedWork()) {
        continue;
      }

      const snapshot = collector.getSnapshot();
      if (!snapshot) {
        continue;
      }

      if (id === "compose") {
        next.compose = snapshot as ComposeDraft;
        savedSomething = true;
      }

      if (id === "unlock") {
        next.unlock = snapshot as UnlockDraft;
        savedSomething = true;
      }
    }

    if (!savedSomething) {
      return false;
    }

    saveDrafts(next);
    return true;
  }, []);

  const value = useMemo(
    () => ({
      registerCollector,
      saveAllDrafts,
      hasUnsavedWork,
    }),
    [registerCollector, saveAllDrafts, hasUnsavedWork],
  );

  return (
    <SessionDraftContext.Provider value={value}>{children}</SessionDraftContext.Provider>
  );
}

export function useSessionDrafts() {
  const context = useContext(SessionDraftContext);
  if (!context) {
    throw new Error("useSessionDrafts must be used within SessionDraftProvider");
  }
  return context;
}
