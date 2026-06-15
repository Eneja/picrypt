"use client";

import { customAlphabet } from "nanoid";
import { useState } from "react";
import { decryptMessage, encryptMessage } from "@/lib/crypto";
import { buildShareUrl, parseShareUrl } from "@/lib/url";

const generateDropId = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
  12,
);

type ExpiryPreset = "1" | "7" | "30";

function getExpiryDate(days: ExpiryPreset): string {
  const date = new Date();
  date.setDate(date.getDate() + Number(days));
  return date.toISOString();
}

export default function HomePage() {
  const [message, setMessage] = useState("");
  const [expiryDays, setExpiryDays] = useState<ExpiryPreset>("7");
  const [shareLink, setShareLink] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [pasteUrl, setPasteUrl] = useState("");
  const [revealedMessage, setRevealedMessage] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-12 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Picrypt</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Encrypted links that look like photos. Share anywhere. Paste the full link here to
          read the message.
        </p>
      </header>

      <section className="space-y-4 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
        <h2 className="text-lg font-medium">Create a link</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              placeholder="Write your secret message..."
              className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="expiry" className="text-sm font-medium">
              Expires in
            </label>
            <select
              id="expiry"
              value={expiryDays}
              onChange={(event) => setExpiryDays(event.target.value as ExpiryPreset)}
              className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700"
            >
              <option value="1">1 day</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {isCreating ? "Creating..." : "Create link"}
          </button>
        </form>

        {createError ? <p className="text-sm text-red-600">{createError}</p> : null}

        {shareLink ? (
          <div className="space-y-3 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-900">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Clicking this link shows a photo. Copy the entire link and paste it below to read
              the message. Do not use URL shorteners.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareLink}
                className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-950"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
        <h2 className="text-lg font-medium">Unlock a link</h2>
        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="paste-url" className="text-sm font-medium">
              Paste Picrypt link
            </label>
            <textarea
              id="paste-url"
              value={pasteUrl}
              onChange={(event) => setPasteUrl(event.target.value)}
              rows={3}
              placeholder="https://picrypt.app/i/..."
              className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700"
            />
          </div>

          <button
            type="submit"
            disabled={isUnlocking}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {isUnlocking ? "Decrypting..." : "Reveal message"}
          </button>
        </form>

        {unlockError ? <p className="text-sm text-red-600">{unlockError}</p> : null}

        {revealedMessage ? (
          <div className="space-y-2 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-900">
            <p className="text-sm font-medium">Message</p>
            <p className="whitespace-pre-wrap text-sm">{revealedMessage}</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
