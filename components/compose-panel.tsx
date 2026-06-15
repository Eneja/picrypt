"use client";

import { MessageEditor } from "@/components/message-editor";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { customAlphabet } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { encryptMessage } from "@/lib/crypto";
import { buildShareUrl } from "@/lib/url";

const generateDropId = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
  12,
);

type ExpiryPreset = "1" | "7" | "30";

const expiryOptions: { value: ExpiryPreset; label: string }[] = [
  { value: "1", label: "1 day" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
];

function getExpiryDate(days: ExpiryPreset): string {
  const date = new Date();
  date.setDate(date.getDate() + Number(days));
  return date.toISOString();
}

export function ComposePanel() {
  const [message, setMessage] = useState("");
  const [expiryDays, setExpiryDays] = useState<ExpiryPreset>("7");
  const [shareLink, setShareLink] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareLinkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shareLink) {
      return;
    }

    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";

    shareLinkRef.current?.scrollIntoView({ behavior, block: "end" });
  }, [shareLink]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreateError("");
    setShareLink("");
    setCopied(false);

    if (!message.trim()) {
      setCreateError("Enter a message to encrypt.");
      return;
    }

    setIsCreating(true);

    try {
      const id = generateDropId();
      const { payload, key } = await encryptMessage(message.trim());
      const expiresAt = getExpiryDate(expiryDays);

      const response = await fetch("/api/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, payload, expiresAt }),
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to create drop");
      }

      setShareLink(buildShareUrl(id, key));
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create link");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleCopy() {
    if (!shareLink) {
      return;
    }

    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      role="tabpanel"
      id="panel-compose"
      aria-labelledby="tab-compose"
      className="space-y-6 py-6"
    >
      <form onSubmit={handleCreate} className="space-y-6">
        <MessageEditor
          id="message"
          value={message}
          onChange={setMessage}
          placeholder="Write your message…"
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Expires in</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Expiry duration">
              {expiryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={expiryDays === option.value}
                  onClick={() => setExpiryDays(option.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors motion-safe:duration-200",
                    expiryDays === option.value
                      ? "border-accent bg-accent-soft text-foreground"
                      : "border-border bg-surface text-muted hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" isLoading={isCreating} className="w-full sm:w-auto sm:min-w-[180px]">
            {isCreating ? "Creating…" : "Create encrypted link"}
          </Button>
        </div>
      </form>

      {createError ? <Alert variant="error">{createError}</Alert> : null}

      {shareLink ? (
        <div ref={shareLinkRef} className="scroll-mt-6">
          <Card className="space-y-4 border-accent/20 bg-accent-soft p-5">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Your link is ready</p>
            <p className="text-sm leading-relaxed text-muted">
              Clicking shows a photo. Copy the entire link and paste it in Unlock to read the
              message. Do not use URL shorteners.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              readOnly
              value={shareLink}
              aria-label="Share link"
              className="font-mono text-[13px]"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleCopy}
              className="shrink-0 sm:w-auto"
              aria-live="polite"
            >
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        </Card>
        </div>
      ) : null}
    </div>
  );
}
