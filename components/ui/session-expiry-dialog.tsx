"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatCountdown } from "@/lib/session-timeout";
import { useEffect, useId, useRef } from "react";

interface SessionExpiryDialogProps {
  open: boolean;
  secondsRemaining: number;
  hasUnsavedWork: boolean;
  draftSaved: boolean;
  isSaving: boolean;
  onSaveDraft: () => void;
  onStaySignedIn: () => void;
}

export function SessionExpiryDialog({
  open,
  secondsRemaining,
  hasUnsavedWork,
  draftSaved,
  isSaving,
  onSaveDraft,
  onStaySignedIn,
}: SessionExpiryDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const staySignedInRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    staySignedInRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onStaySignedIn();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onStaySignedIn]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Stay signed in"
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[1px]"
        onClick={onStaySignedIn}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          "relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg shadow-black/10 dark:shadow-black/40",
        )}
      >
        <div className="space-y-2">
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            Session expiring soon
          </h2>
          <p id={descriptionId} className="text-sm leading-relaxed text-muted">
            You&apos;ve been inactive. You will be signed out in{" "}
            <span className="font-medium text-foreground">
              {formatCountdown(secondsRemaining)}
            </span>
            {hasUnsavedWork
              ? ". Any unsaved work will be lost unless you save a draft."
              : "."}
          </p>
          {draftSaved ? (
            <p className="text-sm font-medium text-accent">Draft saved to this device.</p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            ref={staySignedInRef}
            type="button"
            variant="secondary"
            disabled={isSaving}
            onClick={onStaySignedIn}
          >
            Stay signed in
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!hasUnsavedWork || draftSaved}
            isLoading={isSaving}
            onClick={onSaveDraft}
          >
            {draftSaved ? "Draft saved" : "Save draft"}
          </Button>
        </div>
      </div>
    </div>
  );
}
