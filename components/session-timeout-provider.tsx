"use client";

import { SessionExpiryDialog } from "@/components/ui/session-expiry-dialog";
import { useSessionDrafts } from "@/components/session-draft-provider";
import { createClient } from "@/lib/supabase/client";
import {
  INACTIVITY_TIMEOUT_MS,
  SESSION_WARNING_AT_MS,
  SESSION_WARNING_MS,
} from "@/lib/session-timeout";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"] as const;
const ACTIVITY_THROTTLE_MS = 1000;

export function SessionTimeoutProvider({ children }: { children: ReactNode }) {
  const { saveAllDrafts, hasUnsavedWork } = useSessionDrafts();
  const [enabled, setEnabled] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(SESSION_WARNING_MS / 1000);
  const [draftSaved, setDraftSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityResetRef = useRef(0);
  const showWarningRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const signOutDueToInactivity = useCallback(async () => {
    clearTimers();
    setShowWarning(false);

    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/signed-out?reason=inactivity";
  }, [clearTimers]);

  const startInactivityTimers = useCallback(() => {
    clearTimers();

    warningTimerRef.current = setTimeout(() => {
      showWarningRef.current = true;
      setSecondsRemaining(SESSION_WARNING_MS / 1000);
      setShowWarning(true);
    }, SESSION_WARNING_AT_MS);

    logoutTimerRef.current = setTimeout(() => {
      void signOutDueToInactivity();
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearTimers, signOutDueToInactivity]);

  const resetTimers = useCallback(() => {
    setShowWarning(false);
    setDraftSaved(false);
    setSecondsRemaining(SESSION_WARNING_MS / 1000);
    showWarningRef.current = false;
    startInactivityTimers();
  }, [startInactivityTimers]);

  const handleActivity = useCallback(() => {
    if (!enabled || showWarningRef.current) {
      return;
    }

    const now = Date.now();
    if (now - lastActivityResetRef.current < ACTIVITY_THROTTLE_MS) {
      return;
    }

    lastActivityResetRef.current = now;
    resetTimers();
  }, [enabled, resetTimers]);

  const handleStaySignedIn = useCallback(() => {
    lastActivityResetRef.current = Date.now();
    resetTimers();
  }, [resetTimers]);

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);

    try {
      const saved = saveAllDrafts();
      if (saved) {
        setDraftSaved(true);
        handleStaySignedIn();
      }
    } finally {
      setIsSaving(false);
    }
  }, [handleStaySignedIn, saveAllDrafts]);

  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setEnabled(Boolean(data.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const isLoggedIn = Boolean(session?.user);
      setEnabled(isLoggedIn);

      if (!isLoggedIn) {
        clearTimers();
        setShowWarning(false);
        setDraftSaved(false);
        showWarningRef.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [clearTimers]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    startInactivityTimers();

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }

    return () => {
      clearTimers();
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handleActivity);
      }
    };
  }, [clearTimers, enabled, handleActivity, startInactivityTimers]);

  useEffect(() => {
    if (!showWarning) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsRemaining((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [showWarning]);

  return (
    <>
      {children}
      <SessionExpiryDialog
        open={enabled && showWarning}
        secondsRemaining={secondsRemaining}
        hasUnsavedWork={hasUnsavedWork()}
        draftSaved={draftSaved}
        isSaving={isSaving}
        onSaveDraft={() => void handleSaveDraft()}
        onStaySignedIn={handleStaySignedIn}
      />
    </>
  );
}
