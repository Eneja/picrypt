import { cn } from "@/lib/cn";

interface MessageReaderProps {
  message?: string;
  emptyMessage?: string;
}

export function MessageReader({
  message,
  emptyMessage = "Paste a Picrypt link above to read the message.",
}: MessageReaderProps) {
  if (!message) {
    return (
      <div
        className={cn(
          "flex min-h-[40vh] items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 p-8 md:min-h-[50vh]",
        )}
      >
        <p className="max-w-sm text-center text-base leading-relaxed text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-prose rounded-xl border border-border bg-surface p-6 shadow-sm shadow-black/[0.03] md:p-8 dark:shadow-black/20">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted">Message</p>
      <div className="font-serif text-[17px] leading-relaxed whitespace-pre-wrap text-foreground">
        {message}
      </div>
    </article>
  );
}
