"use client";

import { MessageReader } from "@/components/message-reader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { decryptMessage } from "@/lib/crypto";
import { parseShareUrl } from "@/lib/url";

export function UnlockPanel() {
  const [pasteUrl, setPasteUrl] = useState("");
  const [revealedMessage, setRevealedMessage] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  async function handleUnlock(event: React.FormEvent) {
    event.preventDefault();
    setUnlockError("");
    setRevealedMessage("");

    const parsed = parseShareUrl(pasteUrl);
    if (!parsed) {
      setUnlockError("Invalid Picrypt link. Paste the full URL including the part after #.");
      return;
    }

    setIsUnlocking(true);

    try {
      const response = await fetch(`/api/drops/${parsed.id}`);

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (response.status === 410) {
        throw new Error("This link has expired.");
      }

      if (!response.ok) {
        throw new Error("Drop not found.");
      }

      const data = (await response.json()) as { payload: string };
      const plaintext = await decryptMessage(data.payload, parsed.key);
      setRevealedMessage(plaintext);
    } catch (error) {
      if (error instanceof Error && error.message.includes("decrypt")) {
        setUnlockError("Could not decrypt. Check that you copied the entire link.");
      } else {
        setUnlockError(error instanceof Error ? error.message : "Failed to unlock message");
      }
    } finally {
      setIsUnlocking(false);
    }
  }

  return (
    <div
      role="tabpanel"
      id="panel-unlock"
      aria-labelledby="tab-unlock"
      className="space-y-6 py-6"
    >
      <form onSubmit={handleUnlock} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="paste-url" className="text-sm font-medium text-foreground">
            Picrypt link
          </label>
          <Textarea
            id="paste-url"
            value={pasteUrl}
            onChange={(event) => setPasteUrl(event.target.value)}
            rows={2}
            placeholder="https://picrypt.app/i/..."
            className="font-mono text-base leading-normal"
          />
        </div>

        <Button type="submit" isLoading={isUnlocking} className="w-full sm:w-auto">
          {isUnlocking ? "Decrypting…" : "Reveal message"}
        </Button>
      </form>

      {unlockError ? <Alert variant="error">{unlockError}</Alert> : null}

      <MessageReader message={revealedMessage || undefined} />
    </div>
  );
}
